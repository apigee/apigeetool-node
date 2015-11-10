/* jshint node: true  */
'use strict';

var util = require('util');
var path = require('path');
var async = require('async');
var fs = require('fs');
var mustache = require('mustache');
var _ = require('underscore');
var unzip = require('node-unzip-2');
var tmp = require('tmp');
tmp.setGracefulCleanup();

var defaults = require('../defaults');
var options = require('../options');
var ziputils = require('../ziputils');
var parseDeployments = require('./parsedeployments');
var fetchproxy = require('./fetchproxy');
var deployproxy = require('./deployproxy');

var DeploymentDelay = 60;
var ProxyBase = 'apiproxy';

// By default, do not run NPM remotely
var DefaultResolveModules = false;

var descriptor = defaults.defaultDescriptor({
  api: {
    name: 'API Name',
    shortOption: 'n',
    required: false
  },
  environments: {
    name: 'Environments',
    shortOption: 'e',
    required: true
  },
  directory: {
    name: 'Directory',
    shortOption: 'd',
    required: false
  },
  main: {
    name: 'Main Script',
    shortOption: 'm',
    required: false
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
  },
  'resolve-modules': {
    name: 'Resolve Modules',
    shortOption: 'R',
    toggle: true
  },
  'upload-modules': {
    name: 'Upload Modules',
    shortOption: 'U',
    toggle: true
  },
  'preserve-policies': {
    name: 'Preserve policies from previous revision',
    shortOption: 'P',
    toggle: true
  }
});
module.exports.descriptor = descriptor;

module.exports.format = function(r) {
  var result = '';
  r.forEach(function(e) {
    result = result + parseDeployments.formatDeployment(e);
  });
  return result;
};

module.exports.run = function(opts, cb) {
  if (!opts.directory) {
    opts.directory = process.cwd();
  }
  if (!opts.main || !opts.api) {
    try {
      var packageFile = path.resolve(opts.directory, 'package.json');
      var packageObj = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
      if (!opts.main) {
        opts.main = packageObj.main;
      }
      if (!opts.api) {
        opts.api = packageObj.name;
      }
    } catch (err) {
      if (opts.debug) {
        console.error('unable to read package.json', err);
      }
    }
  }
  descriptor.main.required = true;
  descriptor.api.required = true;
  options.validateSync(opts, descriptor);
  if (opts.debug) {
    console.log('deploynodeapp: %j', opts);
  }

  var request = defaults.defaultRequest(opts);

  getDeploymentInfo(opts, request, function(err) {
    if (err) { return cb(err); }

    // if preserve-policies, we do something entirely different...
    if (opts['preserve-policies'] && opts.deploymentVersion > 1) {
      return preservePoliciesRun(opts, cb);
    }

    // Run each function in series, and collect an array of results.
    async.series([
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
          runNpm(opts, request, done);
        },
        function(done) {
          deployProxy(opts, request, done);
        }
      ],
      function(err, results) {
        if (err) { return cb(err); }
        if (opts.debug) { console.log('results: %j', results); }

        async.map(_.values(results[results.length - 1]),
          function(result, cb) {

            if (opts.debug) { console.log('result: %j', result); }

            var deployment = parseDeployments.parseDeploymentResult(result);
            if (deployment) {
              // Look up the deployed URI for user-friendliness
              parseDeployments.getPathInfo([ deployment ], opts, function(err) {
                // Ignore this error because deployment worked
                if (err && opts.verbose) { console.log('Error looking up deployed path: %s', err); }
                cb(undefined, deployment);
              });
            } else {
              // Probably import-only -- do nothing
              cb(undefined, {});
            }
          },
          cb);
      });
  });
};

function preservePoliciesRun(opts, cb) {

  // download the proxy to a temporary zip file
  tmp.file(function(err, fetchedProxyZip) {
    if (err) { return cb(err); }

    opts.revision = opts.deploymentVersion - 1;
    opts.file = fetchedProxyZip;

    if (opts.verbose) { console.log('Downloading proxy %s revision %d', opts.name, opts.revision); }
    fetchproxy.run(opts, function(err) {
      if (err) { return cb(err); }

      // set up temporary project dir
      tmp.dir({ unsafeCleanup: false }, function(err, tmpDir) {
        if (err) { return cb(err); }

        unzipProxy(opts, tmpDir, function(err) {
          if (err) { return cb(err); }

          // copy node files to tmpDir node directory
          var nodeResourceDir = path.resolve(tmpDir, 'apiproxy/resources/node');
          copyNodeSource(opts, nodeResourceDir, function(err) {
            if (err) { return cb(err); }

            // deploy proxy at tmpDir
            opts.directory = tmpDir;
            deployproxy.run(opts, cb);
          });
        });
      });
    });
  });
}

function unzipProxy(opts, destDir, cb) {

  if (opts.debug) { console.log('Extracting proxy to', destDir); }

  var count = 1;
  var called = false;
  function done(err) {
    if (!called) {
      count--;
      if (err || count === 0) { cb(err); }
    }
  }

  fs.createReadStream(opts.file)
    .pipe(unzip.Parse())
    .on('error', done)
    .on('close', done)
    .on('entry', function (entry) {
      if (entry.path.indexOf('apiproxy/resources/node') === 0) {
        if (opts.debug) { console.log('skipping', entry.path); }
        entry.autodrain(); // ignore all node resources
      } else {
        count++;
        if (opts.debug) { console.log('extracting', entry.path); }
        var destFile = path.resolve(destDir, entry.path);
        mkdirs(path.dirname(destFile), function(err) {
          if (err) { return cb(err); }

          entry
            .pipe(fs.createWriteStream(destFile))
            .on('error', done)
            .on('close', done);
        });
      }
    });
}

function mkdirs(dirpath, cb) {

  var parts = dirpath.split(path.sep);
  var start = 1;
  if (dirpath[0] === path.sep) {
    parts[0] = '/';
    start = 2;
  }
  for (var i = start; i <= parts.length; i++) {
    try {
      var dir = path.join.apply(null, parts.slice(0, i));
      fs.mkdirSync(dir);
    } catch (err) {
      if (err.code !== 'EEXIST') { return cb(err); }
    }
  }
  cb();
}

function copyNodeSource(opts, targetDir, cb) {

  if (opts.verbose) { console.log('Copying node source into proxy'); }

  // Get a list of entries, broken down by which are directories,
  // and with special handling for the node_modules directory.
  ziputils.enumerateNodeDirectory(opts.directory, opts.remoteNpm, function(err, entries) {
    if (err) { return cb(err); }

    if (opts.debug) { console.log('Directories to copy: %j', entries); }

    function copyResource(entry, done) {

      if (entry.directory) {
        // ZIP up all directories, possibly with additional file prefixes
        if (opts.verbose) { console.log('Zipping: %s', entry.fileName); }
        ziputils.zipDirectory(entry.fileName, entry.zipEntryName, function(err, zipBuf) {
          if (err) { return done(err); }

          // write zipBuf -> file
          var zipFileName = path.resolve(targetDir, entry.resourceName);

          if (opts.verbose) { console.log('Writing zip file: %s', zipFileName); }
          fs.writeFile(zipFileName, zipBuf, done);
        });

      } else { // entry.file
        var targetFileName = path.resolve(targetDir, entry.resourceName);
        if (opts.verbose) { console.log('copy %s %s', entry.fileName, targetDir); }
        copyFile(entry.fileName, targetFileName, done);
      }
    }

    async.each(entries, copyResource, cb);
  });
}

function copyFile(source, target, cb) {

  mkdirs(path.dirname(target), function(err) {
    if (err) { return cb(err); }

    cb = _.once(cb);
    var wr = fs.createWriteStream(target)
      .on('error', cb)
      .on('close', cb);
    fs.createReadStream(source)
      .pipe(wr)
      .on('error', cb);
  });
}

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

  // Check out some specific parameters that aren't caught by the generic stuff
  opts.remoteNpm = DefaultResolveModules;
  if (opts['upload-modules'] && (opts['upload-modules'] === true)) {
    opts.remoteNpm = false;
  }
  if (opts['resolve-modules'] && (opts['resolve-modules'] === true)) {
    opts.remoteNpm = true;
  }
  if (opts.debug) {
    console.log('Resolve NPM modules = %s', opts.debug);
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
  ziputils.enumerateNodeDirectory(opts.directory, opts.remoteNpmremoteNpm, function(err, entries) {
    if (err) { return done(err); }

    if (opts.debug) { console.log('Directories to upload: %j', entries); }

    async.eachLimit(entries, opts.asynclimit, function(entry, entryDone) {
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
              console.log('Uploading resource %s of size %d',  entry.resourceName, zipBuf.length);
            }
            request({
              uri: uri,
              method: 'POST',
              json: false,
              headers: { 'Content-Type': 'application/octet-stream' },
              body: zipBuf
            }, function(err, req, body) {
              handleUploadResult(err, req, entry.fileName, entryDone);
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
          handleUploadResult(err, req, entry.fileName, entryDone);
        });

        var fileStream = fs.createReadStream(entry.fileName);
        fileStream.pipe(httpReq);
      }
    }, function(err) {
      done(err);
    });
  });
}

function handleUploadResult(err, req, fileName, itemDone) {
  if (err) {
    itemDone(err);
  } else if ((req.statusCode === 200) || (req.statusCode === 201)) {
    itemDone();
  } else {
    itemDone(new Error(util.format('Error uploading resource %s: %d\n%s',
      fileName, req.statusCode, req.body)));
  }
}

// Create a target endpoint that references the Node.js script
function createTarget(opts, request, done) {
  var targetDoc = mustache.render(
    '<TargetEndpoint name="default">' +
    '<PreFlow name="PreFlow"/>' +
    '<PostFlow name="PostFlow"/>' +
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
    handleUploadResult(err, req, 'targets/default.xml', done);
  });
}

// Create a proxy endpoint that references the Node.js script
function createProxy(opts, request, done) {
  var vhostStr = (opts.virtualhosts ? opts.virtualhosts : 'default,secure');
  // Create an array of objects for underscore
  var vhosts = _.map(vhostStr.split(','), function(i) {
    return { name: i };
  });

  var basepath = (opts['base-path'] ? opts['base-path'] : '/');

  var targetDoc = mustache.render(
    '<ProxyEndpoint name="default">' +
    '<PreFlow name="PreFlow"/>' +
    '<PostFlow name="PostFlow"/>' +
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
    handleUploadResult(err, req, 'proxies/default.xml', done);
  });
}

function runNpm(opts, request, done) {
  if (!opts.remoteNpm) {
    done();
  } else {
    if (opts.verbose) {
      console.log('Running "npm install" at Apigee. This may take several minutes.');
    }

    var body = {
      command: 'install'
    };
    if (opts.debug) {
      body.verbose = true;
    }

    request({
      uri: util.format('%s/v1/o/%s/apis/%s/revisions/%d/npm',
             opts.baseuri, opts.organization, opts.api, opts.deploymentVersion),
      method: 'POST',
      form: body,
      headers: {
        'Accept': 'text/plain'
      },
      json: false
    }, function(err, req, body) {
      if (err) {
        done(err);
      } else if (req.statusCode === 200) {
        if (opts.verbose) {
          console.log('NPM complete.');
          console.log(body);
        }
        done();
      } else {
        if (opts.verbose) {
          console.log('NPM failed with %d', req.statusCode);
          console.log(body);
        }
        done(new Error(util.format('NPM install failed with status code %d', req.statusCode)));
      }
    });
  }
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
                opts.api, opts.environments);
  }

  var environments = opts.environments.split(',');

  function deployToEnvironment(environment, done) {

    var uri = util.format('%s/v1/o/%s/e/%s/apis/%s/revisions/%d/deployments',
      opts.baseuri, opts.organization, environment, opts.api,
      opts.deploymentVersion);

    if (opts.debug) { console.log('Going to POST to %s', uri); }

    // Unlike "deployproxy" command, ignore the base path here, because we baked it into the proxy definition.
    var deployCmd = util.format('action=deploy&override=true&delay=%d', DeploymentDelay);

    if (opts.debug) { console.log('Going go send command %s', deployCmd); }

    request({
      uri: uri,
      method: 'POST',
      json: false,
      body: deployCmd,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      }
    }, function(err, req, body) {
      if (err) { return done(err); }

      var jsonBody = (body ? JSON.parse(body) : null);

      if (req.statusCode === 200) {
        if (opts.verbose) { console.log('Deployment on %s successful', environment); }
        if (opts.debug) { console.log('%s', body); }
        return done(undefined, jsonBody);
      }

      if (opts.verbose) { console.error('Deployment on %s result: %j', environment, body); }
      var errMsg;
      if (jsonBody && (jsonBody.message)) {
        errMsg = jsonBody.message;
      } else {
        errMsg = util.format('Deployment on %s failed with status code %d', environment, req.statusCode);
      }
      done(new Error(errMsg));
    });
  }

  var tasks = {};
  environments.forEach(function(env) {
    tasks[env] = deployToEnvironment.bind(this, env);
  });

  async.parallel(tasks, done);
}
