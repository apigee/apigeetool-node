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

var ProxyBase = 'apiproxy';
var XmlExp = /(.+)\.xml$/;
var DeploymentDelay = 60;

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
    console.log('listdeployments: %j', opts);
  }

  var request = defaults.defaultRequest(opts);

  // Run each function in series, passing the result of each to the next.
  // In the callback, return the last result (which is what we want).
  // Stop as soon as any function returns an error.
  async.waterfall([
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
    },
    function(done) {
      displayStatus(opts, request, done);
    }
    ],
    cb);
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

function uploadResources(opts, request, done) {
  var resBaseDir = path.join(opts.directory, ProxyBase, 'resources');
  var resTypes;
  try {
    resTypes = fs.readdirSync(resBaseDir);
  } catch (e) {
    if (e.code === 'ENOENT') {
      if (opts.verbose) {
        console.log('No resources found');
      }
      done();
    } else {
      done(e);
    }
    return;
  }
  async.eachSeries(resTypes, function(resType, resDone) {
    uploadResourceType(opts, request, done, resBaseDir, resType);
  }, done);
}

function uploadResourceType(opts, request, done, resBaseDir, resType) {
  var resFiles = fs.readdirSync(path.join(resBaseDir, resType));

  async.eachLimit(resFiles, opts.asyncLimit, function(resFileName, itemDone) {
    var rp = path.join(resBaseDir, resType, resFileName);
    var stat = fs.statSync(rp);
    if (!stat.isFile()) {
      if (opts.verbose) {
        console.log('Skipping file %s which is not a regular file', rp);
      }
      return;
    }

    if (opts.verbose) {
      console.log('Uploading resource %s of type %s', resType, resFileName);
    }
    var uri = util.format('%s/v1/o/%s/apis/%s/revisions/%d/resources?type=%s&name=%s',
                opts.baseuri, opts.organization, opts.api,
                opts.deploymentVersion, resType, resFileName);

    var postReq = request({
      uri: uri,
      headers: { 'Content-Type': 'application/octet-stream' },
      json: false,
      method: 'POST'
    }, function(err, req, body) {
      if (err) {
        itemDone(err);
      } else if ((req.statusCode === 200) || (req.statusCode === 201)) {
        itemDone();
      } else {
        itemDone(new Error(util.format('Error uploading resource: %s',
          req.statusCode)));
      }
    });

    var rf = fs.createReadStream(rp);
    rf.pipe(postReq);

  }, done);
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
    var uri = util.format('%s/v1/o/%s/apis/%s/revisions/%d/policies?name=%s',
                opts.baseuri, opts.organization, opts.api,
                opts.deploymentVersion, fileName);
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
        itemDone(new Error(util.format('Error uploading proxy: %s',
          req.statusCode)));
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
