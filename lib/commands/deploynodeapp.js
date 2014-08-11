/* jshint node: true  */
'use strict';

var util = require('util');
var path = require('path');
var async = require('async');
var fs = require('fs');
var mustache = require('mustache');
var _ = require('underscore');

var defaults = require('../defaults');
var options = require('../options');
var ziputils = require('../ziputils');
var parseDeployments = require('./parsedeployments');

var XmlExp = /(.+)\.xml$/;
var DeploymentDelay = 60;
var ProxyBase = 'apiproxy';

var descriptor = defaults.defaultDescriptor({
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
  virtualhosts: {
    name: 'Virtual Hosts',
    shortOption: 'v'
  },
  'base-path': {
    name: 'Base Path',
    shortOption: 'b'
  },
  'import-only': {
    name: 'Import Only',
    shortOption: 'i',
    toggle: true
  }
});
module.exports.descriptor = descriptor;

module.exports.format = function(r) {
  if (r.name) {
    return parseDeployments.formatDeployment(r);
  } else {
    return '';
  }
};

module.exports.run = function(opts, cb) {
  defaults.defaultOptions(opts);
  if (opts.debug) {
    console.log('deploynodeapp: %j', opts);
  }
  options.validateSync(opts, descriptor);

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
    }
    ],
    function(err, results) {
      if (err) {
        cb(err);
      } else {
        if (opts.debug) {
          console.log('results: %j', results);
        }

        var deployResult = results[results.length - 1];
        var deployment = parseDeployments.parseDeploymentResult(deployResult);
        if (deployment) {
          // Look up the deployed URI for user-friendliness
          parseDeployments.getPathInfo([ deployment ], opts, function(err) {
            if (err) {
              // Ignore this error because deployment worked
              if (opts.verbose) {
                console.log('Error looking up deployed path: %s', err);
              }
            }
            cb(undefined, deployment);
          });
        } else {
          // Probably import-only -- do nothing
          cb(undefined, {});
        }
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

  var uri = util.format('%s/v1/o/%s/apis?action=import&validate=false&name=%s',
                        opts.baseuri, opts.organization, opts.api);
  if (opts.debug) {
    console.log('Calling %s', uri);
  }
  if (opts.verbose) {
    console.log('Creating revision %d of API %s', opts.deploymentVersion,
               opts.api);
  }
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
  // Get a list of entries, broken down by which are directories,
  // and with special handling for the node_modules directory.
  var entries;
  try {
    entries = ziputils.enumerateNodeDirectory(opts.directory);
  } catch (e) {
    done(e);
    return;
  }

  if (opts.debug) {
    console.log('Directories to upload: %j', entries);
  }

  async.eachLimit(entries, opts.asyncLimit, function(entry, entryDone) {
    var uri =
      util.format('%s/v1/o/%s/apis/%s/revisions/%d/resources?type=node&name=%s',
                  opts.baseuri, opts.organization, opts.api,
                  opts.deploymentVersion, entry.resourceName);
    if (entry.directory) {
      // ZIP up all directories, possibly with additional file prefixes
      ziputils.zipDirectory(entry.fileName, entry.zipEntryName, function(err, zipBuf) {
        if (err) {
          entryDone(err);
        } else {
          if (opts.verbose) {
            console.log('Uploading resource %s', entry.resourceName);
          }
          request({
            uri: uri,
            method: 'POST',
            json: false,
            headers: { 'Content-Type': 'application/octet-stream' },
            body: zipBuf
          }, function(err, req, body) {
            handleUploadResult(err, req, entryDone);
          });
        }
      });

    } else {
      if (opts.verbose) {
        console.log('Uploading resource %s', entry.resourceName);
      }
      var httpReq = request({
        uri: uri,
        method: 'POST',
        json: false,
        headers: { 'Content-Type': 'application/octet-stream' }
      }, function(err, req, body) {
        handleUploadResult(err, req, entryDone);
      });

      var fileStream = fs.createReadStream(entry.fileName);
      fileStream.pipe(httpReq);
    }
  }, function(err) {
    done(err);
  });
}

function handleUploadResult(err, req, itemDone) {
  if (err) {
    itemDone(err);
  } else if ((req.statusCode === 200) || (req.statusCode === 201)) {
    itemDone();
  } else {
    itemDone(new Error(util.format('Error uploading resource: %d\n%s',
      req.statusCode, req.body)));
  }
}

// Create a target endpoint that references the Node.js script
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

// Create a proxy endpoint that references the Node.js script
function createProxy(opts, request, done) {
  var vhostStr = (opts.virtualhosts ? opts.virtualhosts : 'default');
  // Create an array of objects for underscore
  var vhosts = _.map(vhostStr.split(','), function(i) {
    return { name: i };
  });

  var basepath = (opts['base-path'] ? opts['base-path'] : '/');

  var targetDoc = mustache.render(
    '<ProxyEndpoint name="default">' +
    '<HTTPProxyConnection>' +
    '<BasePath>{{basepath}}</BasePath>' +
    '{{#vhosts}}<VirtualHost>{{name}}</VirtualHost>{{/vhosts}}' +
    '</HTTPProxyConnection>' +
    '<RouteRule name="default">' +
    '<TargetEndpoint>default</TargetEndpoint>' +
    '</RouteRule>' +
    '</ProxyEndpoint>', {
      vhosts: vhosts,
      basepath: basepath
    });
  if (opts.debug) {
    console.log('vhosts = %j', vhosts);
    console.log('proxy = %s', targetDoc);
  }

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
  // Unlike "deployproxy," ignore the base path here, because we baked it in
  // to the proxy definition.
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
    var jsonBody = (body ? JSON.parse(body) : null);
    if (err) {
      done(err);
    } else if (req.statusCode === 200) {
      if (opts.verbose) {
        console.log('Deployment successful');
      }
      if (opts.debug) {
        console.log('%s', body);
      }
      done(undefined, jsonBody);
    } else {
      if (opts.verbose) {
        console.error('Deployment result: %j', body);
      }
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
