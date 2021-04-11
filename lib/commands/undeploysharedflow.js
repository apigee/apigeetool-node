/* jshint node: true  */
'use strict';

var util = require('util');
var path = require('path');
var async = require('async');
var fs = require('fs');
var _ = require('underscore');

var defaults = require('../defaults');
var options = require('../options');
var parseDeployments = require('./parsedeployments');

/* From python apigeetool:

 Usage: undeploy -o [organization] -n [proxy name]
 -r [revision] -e [environment]
 -u [username] -p [password]
 -l [Apigee URL]

 -o Apigee organization name
 -n Apigee proxy name
 -e Apigee environment name (optional, see below)
 -r Revision to undeploy (optional, see below)
 -u Apigee user name
 -p Apigee password
 -l Apigee API URL (optional, defaults to https://api.enterprise.apigee.com)
 -h Print this message

 To undeploy all revisions of the proxy in all environments, use -n
 To undeploy a specific revision in all environments, use -r and -n
 To undeploy all revisions in a specific environment, use -n and -e
 Use all three to undeploy a specific revision in a specific environment
 */

var descriptor = defaults.defaultDescriptor({
  name: {
    name: 'Shared Flow Name',
    shortOption: 'n',
    required: true
  },
  environment: {
    name: 'Environment',
    shortOption: 'e',
    required: true
  },
  revision: {
    name: 'Revision',
    shortOption: 'r',
    required: false
  }
});
module.exports.descriptor = descriptor;

module.exports.format = function (r) {
  if (r.name) {
    return parseDeployments.formatDeployment(r);
  } else {
    return '';
  }
};

module.exports.run = function (opts, cb) {
  options.validateSync(opts, descriptor);
  if (opts.debug) {
    console.log('undeploy: %j', opts);
  }

  var request = defaults.defaultRequest(opts);

  // Run each function in series, and collect an array of results.
  async.series([
      function (done) {
        getDeploymentInfo(opts, request, done);
      },
      function (done) {
        undeploy(opts, request, done);
      }
    ],
    function (err, results) {
      if (err) {
        cb(err);
      } else {
        if (opts.debug) {
          console.log('results: %j', results);
        }

        var deployResult = results[results.length - 1];
        var deployment = parseDeployments.parseDeploymentResult(deployResult);
        if (deployment) {
          cb(undefined, deployment);
        } else {
          // Can't parse the result -- do nothing
          cb(undefined, {});
        }
      }
    });
};

function getDeploymentInfo(opts, request, done) {

  // Just undeploy what we said
  if (opts.revision) {
    opts.deploymentVersion = opts.revision;
    done();
    return;
  }

  // Find out which revision we should be undeploying

  request.get(util.format('%s/v1/organizations/%s/sharedflows/%s/deployments',
    opts.baseuri, opts.organization, opts.name),
    function (err, req, body) {
      if (err) {
        done(err);
      } else if (req.statusCode === 404) {
        if (opts.verbose) {
          console.log('SharedFlow %s does not exist.', opts.name);
        }
        done();
      } else if (req.statusCode === 200) {
        // Iterate over the result to get the information on deployment on the specified environment.
        var envFound = false;
        var curEnv;
        var i = 0;
        while ( (i < body.environment.length) && (!envFound) ) {
          curEnv = body.environment[i];
          if (curEnv.name == opts.environment) {
            envFound = true;
            opts.deploymentVersion = parseInt(curEnv.revision[0].name);
          }
          i++;
        } 
        if (!envFound) {
          done(new Error(util.format('SharedFlow not deployed to environment %s', opts.environment)));
        }
        if (opts.verbose) {
          console.log('Going to undeploy revision %d of SharedFlow %s',
            opts.deploymentVersion, opts.name);
        }
        done();
      } else {
        done(new Error(util.format('Get SharedFlow info returned status %d', req.statusCode)));
      }
    });
}

function undeploy(opts, request, done) {
  if (opts.verbose) {
    console.log('Undeploying revision %d of %s to %s', opts.deploymentVersion,
      opts.name, opts.environment);
  }

  var uri = util.format('%s/v1/organizations/%s/environments/%s/sharedflows/%s/revisions/%s/deployments',
    opts.baseuri, opts.organization, opts.environment, opts.name, opts.deploymentVersion);
  if (opts.debug) {
    console.log('Going to POST to %s', uri);
  }

  request({
    uri: uri,
    method: 'DELETE',
    json: false,
    headers: {
      'Content-Type': 'application/octet-stream',
      'Accept': 'application/json'
    }
  }, function (err, req, body) {
    var jsonBody = (body ? JSON.parse(body) : null);
    if (err) {
      done(err);
    } else if (req.statusCode === 200) {
      if (opts.verbose) {
        console.log('Undeployment successful');
      }
      if (opts.debug) {
        console.log('%s', body);
      }
      done(undefined, jsonBody);
    } else {
      if (opts.verbose) {
        console.error('Undeployment result: %j', body);
      }

      var errMsg;
      if (jsonBody && (jsonBody.message)) {
        errMsg = jsonBody.message;
      } else {
        errMsg = util.format('Undeployment failed with status code %d',
          req.statusCode);
      }
      done(new Error(errMsg));
    }
  });
}

