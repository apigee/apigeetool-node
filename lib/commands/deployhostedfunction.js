/* jshint node: true  */
'use strict';

var util = require('util');
var path = require('path');
var async = require('async');
var fs = require('fs');
var mustache = require('mustache');
var _ = require('underscore');
var tmp = require('tmp');
tmp.setGracefulCleanup();

var defaults = require('../defaults');
var options = require('../options');
var ziputils = require('../ziputils');
var parseDeployments = require('./parsedeployments');
var fetchproxy = require('./fetchproxy');
var deployproxy = require('./deployproxy');
var createApiProxy = require('../deploycommon').createApiProxy;
var createProxy = require('../deploycommon').createProxy;
var deployProxy = require('../deploycommon').deployProxy;
var unzipProxy = require('../deploycommon').unzipProxy;
var copyFile = require('../deploycommon').copyFile;
var handleUploadResult = require('../deploycommon').handleUploadResult;

const APP_YAML = 'app.yaml';

var descriptor = defaults.defaultDescriptor({
  api: {
    name: 'API Name',
    shortOption: 'n',
    required: true
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

  descriptor.api.required = true;
  options.validateSync(opts, descriptor);
  if (opts.debug) {
    console.log('deployhostedfunction: %j', opts);
  }

  try {
    fs.statSync(path.join(opts.directory, APP_YAML))
  } catch(err) {
    return cb(new Error("missing required 'app.yaml'"));
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
          uploadHostedSource(opts, request, done);
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

        unzipProxy(opts, tmpDir, 'apiproxy/resources/hosted', function(err) {
          if (err) { return cb(err); }

          // copy hosted files to tmpDir hosted directory
          var sourcesDir = path.resolve(tmpDir, 'apiproxy/resources/hosted');
          copySources(opts, sourcesDir, function(err) {
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

function copySources(opts, targetDir, cb) {

  if (opts.verbose) { console.log('Copying sources into proxy'); }

  // Get a list of entries, broken down by which are directories
  ziputils.enumerateSources(opts.directory, function(err, entries) {
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

function uploadHostedSource(opts, request, done) {

  // Get a list of entries, broken down by which are directories
  ziputils.enumerateSources(opts.directory, function(err, entries) {
    if (err) { return done(err); }

    if (opts.debug) { console.log('Directories to upload: %j', entries); }

    async.eachLimit(entries, opts.asynclimit, function(entry, entryDone) {
      var uri =
        util.format('%s/v1/o/%s/apis/%s/revisions/%d/resources?type=hosted&name=%s',
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

// Create a target endpoint that references the Hosted Function target
function createTarget(opts, request, done) {
  var targetDoc = mustache.render(
    '<TargetEndpoint name="default">' +
    '<PreFlow name="PreFlow"/>' +
    '<PostFlow name="PostFlow"/>' +
    '<HostedTarget/>' +
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
