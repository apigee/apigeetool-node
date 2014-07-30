/* jshint node: true  */
'use strict';

var util = require('util');
var path = require('path');
var async = require('async');

var defaults = require('../defaults');

module.exports.descriptor = defaults.defaultDescriptor({
  api: {
    name: 'API Name',
    shortOption: 'n'
  },
  environment: {
    name: 'Environment',
    shortOption: 'e'
  },
  long: {
    name: 'Long',
    shortOption: 'l',
    toggle: true
  }
});

module.exports.run = function(opts, cb) {
  var uri;
  var parser;

  defaults.defaultOptions(opts);
  if (opts.debug) {
    console.log('listdeployments: %j', opts);
  }

  if (opts.api && !opts.environment) {
    uri = util.format('%s/v1/o/%s/apis/%s/deployments',
                      opts.baseuri, opts.organization, opts.api);
    parser = parseAPIBody;

  } else if (opts.environment && !opts.api) {
    uri = util.format('%s/v1/o/%s/e/%s/deployments',
                      opts.baseuri, opts.organization, opts.environment);
    parser = parseEnvironmentBody;

  } else if (opts.environment && opts.api) {
    cb(new Error('Can\'t specify both API and environment options'));
    return;
  } else {
    cb(new Error('Either "api" or "environment" must be specified'));
    return;
  }

  // Call the standard "deployments" API to get the list of what's deployed
  var request = defaults.defaultRequest(opts);
  if (opts.debug) {
    console.log('Going to invoke "%s"', uri);
  }
  request.get(uri, function(err, req, body) {
    if (err) {
      cb(err);
    } else {
      if (req.statusCode === 200) {
        if (opts.debug) {
          console.log('Result: %j', body);
        }
        var result = parser(body);
        if (opts.long) {
          fillInPaths(result, opts, cb);
        } else {
          if (opts.debug) {
            console.log('All done');
          }
          cb(undefined, result);
        }
      } else {
        throw new Error(util.format('HTTP error %d', req.statusCode));
      }
    }
  });
};

// Normalize the JSON that we get back when we query deployments for an environment
function parseEnvironmentBody(b) {
  var env = b.name;
  var r = {
    deployments: []
  };
  for (var pn in b.aPIProxy) {
    var p = b.aPIProxy[pn];
    for (var prn in p.revision) {
      var pr = p.revision[prn];
      r.deployments.push({
        name: p.name,
        environment: env,
        revision: parseInt(pr.name),
        state: pr.state,
        basePath: pr.configuration.basePath
      });
    }
  }
  return r;
}

// Normalize the JSON that we get back when we query deployments for an environment
function parseAPIBody(b) {
  var name = b.name;
  var r = {
    deployments: []
  };
  for (var en in b.environment) {
    var e = b.environment[en];
    for (var ren in e.revision) {
      var re = e.revision[ren];
      r.deployments.push({
        name: name,
        environment: e.name,
        revision: parseInt(re.name),
        state: re.state,
        basePath: re.configuration.basePath
      });
    }
  }
  return r;
}

// If and only if "-l" is specified, get the URI path from the proxy
// and from the virtual host, in parallel using "async."
function fillInPaths(d, opts, cb) {
  // We will fill this in with "env-vhost" keys and URI values.
  var vhosts = {};
  async.eachLimit(d.deployments, opts.asyncLimit, function(item, done) {
    fillInPath(item, opts, vhosts, done);
  }, function(err) {
    cb(err, d);
  });
}

// Look at the "default" proxy definition to get paths and virtual hosts
// If there is no proxy named "default," punt for now.
function fillInPath(deployment, opts, vhosts, done) {
  var request = defaults.defaultRequest(opts);
  if (opts.debug) {
    console.log('Going to fill in path for %j', opts);
  }
  request.get(util.format('%s/v1/o/%s/apis/%s/revisions/%d/proxies/default',
              opts.baseuri, opts.organization, deployment.name,
              deployment.revision),
    function(err, req, body) {
      if (err) {
        done(err);
      } else {
        if (req.statusCode === 200) {
          if (body.connection && body.connection.basePath) {
            deployment.proxyBasePath = body.connection.basePath;
            deployment.virtualHosts = body.connection.virtualHost;
            deployment.uris = [];
            fillInHosts(deployment, opts, vhosts, done);
          } else {
            done();
          }
        } else if (req.statusCode === 404) {
          // Proxy is not named "default", so just skip
          done();
        } else {
          done(new Error(util.format('HTTP status %d', req.statusCode)));
        }
      }
  });
}

// For each of the proxy's virtual hosts, get the base URI. Cache the
// results to speed up operations on big deployments
function fillInHosts(deployment, opts, vhosts, done) {
  async.eachSeries(deployment.virtualHosts, function(item, itemDone) {
    var hostKey = util.format('%s-%s', deployment.environment, item);
    if (vhosts[hostKey]) {
      deployment.uris.push(makeUri(vhosts[hostKey], deployment.basePath,
                           deployment.proxyBasePath));
      itemDone();
    } else {
      var request = defaults.defaultRequest(opts);
      request.get(util.format('%s/v1/o/%s/e/%s/virtualhosts/%s',
                              opts.baseuri, opts.organization,
                              deployment.environment, item),
        function(err, req, body) {
          if (err) {
            itemDone(err);
          } else if (req.statusCode === 200) {
            var port = parseInt(body.port);
            var uri;
            var scheme = (body.sSLInfo ? 'https' : 'http');
            if (body.hostAliases && (body.hostAliases.length > 0)) {
              uri = util.format('%s://%s', scheme, body.hostAliases[0]);
            } else {
              uri = util.format('%s://localhost', scheme);
            }
            if (((scheme === 'http') && (port != 80)) ||
                ((scheme === 'https') && (port != 443))) {
              uri += ':' + port;
            }
            vhosts[hostKey] = uri;
            deployment.uris.push(makeUri(uri, deployment.basePath,
                                 deployment.proxyBasePath));
            itemDone();
          } else {
            itemDone(new Error(util.format('HTTP error %d', req.statusCode)));
          }
        });
    }
  }, function(err) {
    done(err);
  });
}

function makeUri(hostUri, basePath, proxyPath) {
  if (basePath === '/') {
    return hostUri + proxyPath;
  }
  return hostUri + basePath, proxyPath;
}
