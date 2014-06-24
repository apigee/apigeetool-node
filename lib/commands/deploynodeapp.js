/* jshint node: true  */
'use strict';

var constants = require('constants');
var util = require('util');
var path = require('path');
var async = require('async');
var fs = require('fs');
var mustache = require('mustache');
var _ = require('underscore');

var defaults = require('../defaults');
var fsutils = require('../fsutils');
var ziputils = require('../ziputils');
var listdeployments = require('./listdeployments');

var XmlExp = /(.+)\.xml$/;
var DeploymentDelay = 60;
var ProxyBase = 'apiproxy';

module.exports.descriptor = defaults.defaultDescriptor({
  api: {
    name: 'API Name',
    shortOption: 'n',
    required: true
  },
  environment: {
    name: 'Environment',
    shortOption: 'e',
    required: true
  },
  directory: {
    name: 'Directory',
    shortOption: 'd',
    required: true
  },
  main: {
    name: 'Main Script',
    shortOption: 'm',
    required: true
  },
  'base-path': {
    name: 'Base Path',
    shortOption: 'b'
  },
  'import-only': {
    name: 'Import Only',
    shortOption: 'i'
  }
});

module.exports.run = function(opts, cb) {
  defaults.defaultOptions(opts);
  if (opts.debug) {
    console.log('deploynodeapp: %j', opts);
  }

  var request = defaults.defaultRequest(opts);

  // Run each function in series, and collect an array of results.
  async.series([
    function(done) {
      getDeploymentInfo(opts, request, done);
    },
    function(done) {
      createApiProxy(opts, request, done);
    },
    function(done) {
      uploadNodeSource(opts, request, done);
    },
    function(done) {
      createTarget(opts, request, done);
    },
    function(done) {
      createProxy(opts, request, done);
    },
    function(done) {
      deployProxy(opts, request, done);
    },
    function(done) {
      displayStatus(opts, request, done);
    }
    ],
    function(err, results) {
      if (err) {
        cb(err);
      } else {
        if (opts.debug) {
          console.log('results: %j', results);
        }
        cb(undefined, results[results.length - 1]);
      }
    });
};

function getDeploymentInfo(opts, request, done) {
  // Find out if the root directory is a directory
  var ds;
  try {
    ds = fs.statSync(opts.directory);
  } catch (e) {
    done(new Error(util.format('Proxy base directory %s does not exist',
                   opts.directory)));
    return;
  }
  if (!ds.isDirectory()) {
    done(new Error(util.format('Proxy base directory %s is not a directory',
                   opts.directory)));
    return;
  }

  if (!fs.existsSync(path.join(opts.directory, opts.main))) {
    // Main script might be an absolute path, so fix it up
    opts.main = path.relative(opts.directory, opts.main);
  }
  if (!fs.existsSync(path.join(opts.directory, opts.main))) {
    done(new Error(util.format('Main script file %s does not seem to exist', opts.main)));
    return;
  }
  if (path.dirname(opts.main) !== '.') {
    done(new Error(util.format('Main script file %s must be in the top level directory',
      opts.main)));
      return;
  }

  // Find out which revision we should be creating
  request.get(util.format('%s/v1/o/%s/apis/%s',
               opts.baseuri, opts.organization, opts.api),
  function(err, req, body) {
      if (err) {
        done(err);
      } else if (req.statusCode === 404) {
        opts.deployNewApi = true;
        opts.deploymentVersion = 1;
        if (opts.verbose) {
          console.log('API %s does not exist. Going to create revision 1',
                      opts.api);
        }
        done();
      } else if (req.statusCode === 200) {
        opts.deploymentVersion =
          parseInt(_.max(body.revision, function(r) { return parseInt(r); })) + 1;
        if (opts.verbose) {
          console.log('Going to create revision %d of API %s',
                      opts.deploymentVersion, opts.api);
        }
        done();
      } else {
        done(new Error(util.format('Get API info returned status %d', req.statusCode)));
      }
  });
}

function createApiProxy(opts, request, done) {
  // Create a dummy "API proxy" file for the root of this thing.
  var rootDoc = mustache.render('<APIProxy name="{{api}}"/>', opts);
  var rootEntryName = opts.api + '.xml';

  var uri;
  if (opts.deployNewApi) {
    uri = util.format('%s/v1/o/%s/apis?name=%s',
                      opts.baseuri, opts.organization, opts.api);
    if (opts.verbose) {
      console.log('Creating brand-new API %s', opts.api);
    }
    request({
      uri: uri,
      headers: { 'Content-Type': 'application/xml'},
      method: 'POST',
      body: rootDoc
    }, function(err, req, body) {
      proxyCreationDone(err, req, body, opts, done);
    });

  } else {
    uri = util.format('%s/v1/o/%s/apis?action=import&validate=false&name=%s',
                      opts.baseuri, opts.organization, opts.api);
    if (opts.debug) {
      console.log('Calling %s', uri);
    }
    console.log('Creating revision %d of API %s', opts.deploymentVersion,
               opts.api);
    // The only way to do this is to import a ZIP. What fun.
    var zipBuf = ziputils.makeOneFileZip(ProxyBase, rootEntryName, rootDoc);
    // For debugging
    //fs.writeFileSync('./test.zip', zipBuf);
    request({
      uri: uri,
      headers: { 'Content-Type': 'application/octet-stream' },
      json: false,
      method: 'POST',
      body: zipBuf
    }, function(err, req, body) {
      proxyCreationDone(err, req, body, opts, done);
    });
  }
}

function proxyCreationDone(err, req, body, opts, done) {
  if (err) {
    done(err);
  } else if ((req.statusCode === 200) || (req.statusCode === 201)) {
    done();
  } else {
    if (opts.verbose) {
      console.error('Proxy creation error:', body);
    }
    done(new Error(util.format('Proxy creation failed. Status code %d',
                   req.statusCode)));
  }
}

function uploadNodeSource(opts, request, done) {
  var files = fs.readdirSync(opts.directory);
  // Upload each file in the directory in parallel, within reason
  async.eachLimit(files, opts.asyncLimit, function(fileName, itemDone) {
    var fn = path.join(opts.directory, fileName);
    var stat = fs.statSync(fn);

    var uri = util.format('%s/v1/o/%s/apis/%s/revisions/%d/resources?type=node',
                opts.baseuri, opts.organization, opts.api,
                opts.deploymentVersion);

    var entryName;
    var content;
    if (stat.isDirectory()) {
      // Zip each directory into a ZIP, with relative entry names,
      // and keep the ZIP contents in memory.
      entryName = fileName + '.zip';
      content = ziputils.zipDirectory(fn, fileName, function(err, zipBuf) {
        if (err) {
          itemDone(err);
        }
        if (opts.verbose) {
          console.log('Uploading %s as a Zipped directory', fileName);
        }
        request({
          uri: uri + '&name=' + entryName,
          method: 'POST',
          json: false,
          headers: { 'Content-Type': 'application/octet-stream' },
          body: zipBuf
        }, function(err, req, body) {
          handleUploadResult(err, req, itemDone);
        });
      });

    } else {
      // Just upload the file, which should be easier ;-)
      if (opts.verbose) {
        console.log('Uploading %s as a file', fileName);
      }
      entryName = fileName;
      var httpReq = request({
        uri: uri + '&name=' + entryName,
        method: 'POST',
        json: false,
        headers: { 'Content-Type': 'application/octet-stream' }
      }, function(err, req, body) {
        handleUploadResult(err, req, itemDone);
      });

      var fileStream = fs.createReadStream(fn);
      fileStream.pipe(httpReq);

    }
  }, done);
}

function handleUploadResult(err, req, itemDone) {
  if (err) {
    itemDone(err);
  } else if ((req.statusCode === 200) || (req.statusCode === 201)) {
    itemDone();
  } else {
    itemDone(new Error(util.format('Error uploading resource: %d',
      req.statusCode)));
  }
}

function createTarget(opts, request, done) {
  var targetDoc = mustache.render(
    '<TargetEndpoint name="default">' +
    '<ScriptTarget>' +
    '<ResourceURL>node://{{main}}</ResourceURL>' +
    '</ScriptTarget>' +
    '</TargetEndpoint>', opts);

  var uri = util.format('%s/v1/o/%s/apis/%s/revisions/%d/targets?name=default',
              opts.baseuri, opts.organization, opts.api,
              opts.deploymentVersion);
  if (opts.verbose) {
    console.log('Creating the target endpoint');
  }

  request({
    uri: uri,
    method: 'POST',
    json: false,
    headers: { 'Content-Type': 'application/xml' },
    body: targetDoc
  }, function(err, req, body) {
    handleUploadResult(err, req, done);
  });
}

function createProxy(opts, request, done) {
  // TODO virtual host support!
  var vhost = 'default';
  var basepath = (opts['base-path'] ? opts['base-path'] : '/');

  var targetDoc = mustache.render(
    '<ProxyEndpoint name="default">' +
    '<HTTPProxyConnection>' +
    '<BasePath>{{basepath}}</BasePath>' +
    '<VirtualHost>{{vhost}}</VirtualHost>' +
    '</HTTPProxyConnection>' +
    '<RouteRule name="default">' +
    '<TargetEndpoint>default</TargetEndpoint>' +
    '</RouteRule>' +
    '</ProxyEndpoint>', {
      vhost: vhost,
      basepath: basepath
    });

  var uri = util.format('%s/v1/o/%s/apis/%s/revisions/%d/proxies?name=default',
              opts.baseuri, opts.organization, opts.api,
              opts.deploymentVersion);
  if (opts.verbose) {
    console.log('Creating the proxy endpoint');
  }

  request({
    uri: uri,
    method: 'POST',
    json: false,
    headers: { 'Content-Type': 'application/xml' },
    body: targetDoc
  }, function(err, req, body) {
    handleUploadResult(err, req, done);
  });
}

function deployProxy(opts, request, done) {
  if (opts['import-only']) {
    if (opts.verbose) {
      console.log('Not deploying the proxy right now');
    }
    done();
    return;
  }

  if (opts.verbose) {
    console.log('Deploying revision %d of %s to %s', opts.deploymentVersion,
                opts.api, opts.environment);
  }
  var uri = util.format('%s/v1/o/%s/e/%s/apis/%s/revisions/%d/deployments',
              opts.baseuri, opts.organization, opts.environment, opts.api,
              opts.deploymentVersion);
  if (opts.debug) {
    console.log('Going to POST to %s', uri);
  }

  var deployCmd =
    util.format('action=deploy&override=true&delay=%d', DeploymentDelay);
  if (opts['base-path']) {
    deployCmd = util.format('%s&basepath=%s', deployCmd, opts['base-path']);
  }
  if (opts.debug) {
    console.log('Going go send command %s', deployCmd);
  }

  request({
    uri: uri,
    method: 'POST',
    json: false,
    body: deployCmd,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded',
               'Accept': 'application/json' }
  }, function(err, req, body) {
    if (err) {
      done(err);
    } else if (req.statusCode === 200) {
      if (opts.verbose) {
        console.log('Deployment successful');
      }
      if (opts.debug) {
        console.log('%s', body);
      }
      done();
    } else {
      if (opts.verbose) {
        console.error('Deployment result: %j', body);
      }
      var jsonBody = JSON.parse(body);
      var errMsg;
      if (jsonBody && (jsonBody.message)) {
        errMsg = jsonBody.message;
      } else {
        errMsg = util.format('Deployment failed with status code %d',
                   req.statusCode);
      }
      done(new Error(errMsg));
    }
  });
}

function displayStatus(opts, request, done) {
  if (opts.verbose) {
    console.log('Checking deployment status');
  }
  var deployOpts = {
    organization: opts.organization,
    api: opts.api,
    username: opts.username,
    password:  opts.password,
    verbose: opts.verbose,
    debug: opts.debug
  };
  listdeployments.run(deployOpts, done);
}
