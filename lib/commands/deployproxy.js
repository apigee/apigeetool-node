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
var options = require('../options');
var ziputils = require('../ziputils');
var parseDeployments = require('./parsedeployments');

var ProxyBase = 'apiproxy';
var XmlExp = /(.+)\.xml$/;
var DeploymentDelay = 60;

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
    console.log('deployproxy: %j', opts);
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
      uploadResources(opts, request, done);
    },
    function(done) {
      uploadPolicies(opts, request, done);
    },
    function(done) {
      uploadTargets(opts, request, done);
    },
    function(done) {
      uploadProxies(opts, request, done);
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
    ds = fs.statSync(path.join(opts.directory, ProxyBase));
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
  // Is there a single XML file in the root directory?
  // If not, then create one
  var rootDoc;
  var rootEntryName;

  var pd = path.join(opts.directory, ProxyBase);
  var topFiles = fsutils.readdirSyncFilesOnly(pd);
  if (topFiles.length === 1) {
    var fn = path.join(pd, topFiles[0]);
    rootEntryName = topFiles[0];
    if (opts.verbose) {
      console.log('Using %s as the root file', fn);
    }
    rootDoc = fs.readFileSync(fn);
  } else {
    rootEntryName = opts.api + '.xml';
    rootDoc = mustache.render('<APIProxy name="{{api}}"/>', opts);
  }

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

function uploadResources(opts, request, done) {
  var resBaseDir = path.join(opts.directory, ProxyBase, 'resources');
  // Produce a list of entries to either ZIP or upload.
  var entries;
  try {
    entries = ziputils.enumerateResourceDirectory(resBaseDir);
  } catch (e) {
    if (e.code === 'ENOENT') {
      if (opts.verbose) {
        console.error('No resources found');
      }
      done();
    } else {
      done(e);
    }
    return;
  }

  async.eachLimit(entries, opts.asyncLimit, function(entry, entryDone) {
    var uri =
      util.format('%s/v1/o/%s/apis/%s/revisions/%d/resources?type=%s&name=%s',
                  opts.baseuri, opts.organization, opts.api,
                  opts.deploymentVersion, entry.resourceType, entry.resourceName);
    if (entry.directory) {
      // ZIP up all directories, possibly with additional file prefixes
      ziputils.zipDirectory(entry.fileName, entry.zipEntryName, function(err, zipBuf) {
        if (err) {
          entryDone(err);
        } else {
          if (opts.verbose) {
            console.log('Uploading %s resource %s', entry.resourceType, entry.resourceName);
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
        console.log('Uploading %s resource %s', entry.resourceType, entry.resourceName);
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
    itemDone(new Error(util.format('Error uploading resource: %d',
      req.statusCode)));
  }
}

function uploadPolicies(opts, request, done) {
  var baseDir = path.join(opts.directory, ProxyBase, 'policies');
  var fileNames;
  try {
    fileNames = fs.readdirSync(baseDir);
  } catch (e) {
    if (e.code === 'ENOENT') {
      if (opts.verbose) {
        console.log('No policies found');
      }
      done();
    } else {
      done(e);
    }
    return;
  }

  async.eachLimit(fileNames, opts.asyncLimit, function(fileName, itemDone) {
    var rp = path.join(baseDir, fileName);
    var stat = fs.statSync(rp);
    if (!XmlExp.test(fileName)) {
      if (opts.verbose) {
        console.log('Skipping file %s which is not an XML file', rp);
      }
      return;
    }
    if (!stat.isFile()) {
      if (opts.verbose) {
        console.log('Skipping file %s which is not a regular file', rp);
      }
      return;
    }

    if (opts.verbose) {
      console.log('Uploading policy %s', fileName);
    }
    var uri = util.format('%s/v1/o/%s/apis/%s/revisions/%d/policies',
                opts.baseuri, opts.organization, opts.api,
                opts.deploymentVersion);
    var postReq = request({
      uri: uri,
      headers: { 'Content-Type': 'application/xml' },
      json: false,
      method: 'POST'
    }, function(err, req, body) {
      if (err) {
        itemDone(err);
      } else if ((req.statusCode === 200) || (req.statusCode === 201)) {
        itemDone();
      } else {
        itemDone(new Error(util.format('Error uploading policy: %s',
          req.statusCode)));
      }
    });

    var rf = fs.createReadStream(rp);
    rf.pipe(postReq);

  }, function(err) {
    done(err);
  });
}

function uploadTargets(opts, request, done) {
  var baseDir = path.join(opts.directory, ProxyBase, 'targets');
  var fileNames;
  try {
    fileNames = fs.readdirSync(baseDir);
  } catch (e) {
    if (e.code === 'ENOENT') {
      if (opts.verbose) {
        console.log('No targets found');
      }
      done();
    } else {
      done(e);
    }
    return;
  }

  async.eachLimit(fileNames, opts.asyncLimit, function(fileName, itemDone) {
    var rp = path.join(baseDir, fileName);
    var stat = fs.statSync(rp);
    var isXml = XmlExp.exec(fileName);
    if (!isXml) {
      if (opts.verbose) {
        console.log('Skipping file %s which is not an XML file', rp);
      }
      return;
    }
    if (!stat.isFile()) {
      if (opts.verbose) {
        console.log('Skipping file %s which is not a regular file', rp);
      }
      return;
    }

    if (opts.verbose) {
      console.log('Uploading target %s', isXml[1]);
    }
    var uri = util.format('%s/v1/o/%s/apis/%s/revisions/%d/targets?name=%s',
                opts.baseuri, opts.organization, opts.api,
                opts.deploymentVersion, isXml[1]);
    var postReq = request({
      uri: uri,
      headers: { 'Content-Type': 'application/xml' },
      json: false,
      method: 'POST'
    }, function(err, req, body) {
      if (err) {
        itemDone(err);
      } else if ((req.statusCode === 200) || (req.statusCode === 201)) {
        itemDone();
      } else {
        itemDone(new Error(util.format('Error uploading target: %s',
          req.statusCode)));
      }
    });

    var rf = fs.createReadStream(rp);
    rf.pipe(postReq);

  }, function(err) {
    done(err);
  });
}

function uploadProxies(opts, request, done) {
  var baseDir = path.join(opts.directory, ProxyBase, 'proxies');
  var fileNames;
  try {
    fileNames = fs.readdirSync(baseDir);
  } catch (e) {
    if (e.code === 'ENOENT') {
      if (opts.verbose) {
        console.log('No proxies found');
      }
      done();
    } else {
      done(e);
    }
    return;
  }

  async.eachLimit(fileNames, opts.asyncLimit, function(fileName, itemDone) {
    var rp = path.join(baseDir, fileName);
    var stat = fs.statSync(rp);
    var isXml = XmlExp.exec(fileName);
    if (!isXml) {
      if (opts.verbose) {
        console.log('Skipping file %s which is not an XML file', rp);
      }
      return;
    }
    if (!stat.isFile()) {
      if (opts.verbose) {
        console.log('Skipping file %s which is not a regular file', rp);
      }
      return;
    }

    if (opts.verbose) {
      console.log('Uploading proxy %s', isXml[1]);
    }
    var uri = util.format('%s/v1/o/%s/apis/%s/revisions/%d/proxies?name=%s',
                opts.baseuri, opts.organization, opts.api,
                opts.deploymentVersion, isXml[1]);
    var postReq = request({
      uri: uri,
      headers: { 'Content-Type': 'application/xml' },
      json: false,
      method: 'POST'
    }, function(err, req, body) {
      if (err) {
        itemDone(err);
      } else if ((req.statusCode === 200) || (req.statusCode === 201)) {
        itemDone();
      } else {
        if (opts.verbose) {
          console.error('Deployment result: %j', body);
        }
        var jsonBody = JSON.parse(body);
        var errMsg;
        if (jsonBody && (jsonBody.message)) {
          errMsg = jsonBody.message;
        } else {
          errMsg = util.format('Error uploading proxy: %d',
                               req.statusCode);
        }
        itemDone(new Error(errMsg));
      }
    });

    var rf = fs.createReadStream(rp);
    rf.pipe(postReq);

  }, function(err) {
    done(err);
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
    var jsonBody = (body ? JSON.parse(body) : null);
    if (err) {
      done(err);
    } else if (req.statusCode === 200) {
      if (opts.debug) {
        console.log('%j', jsonBody);
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
