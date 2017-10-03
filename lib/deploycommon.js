/* jshint node: true  */
'use strict';

var async = require('async');
var util = require('util');
var path = require('path');
var fs = require('fs');
var mustache = require('mustache');
var unzip = require('node-unzip-2');
var _ = require('underscore');

var ziputils = require('./ziputils');

var DeploymentDelay = 60
var ProxyBase = 'apiproxy';

module.exports.createApiProxy = function(opts, request, done) {
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

module.exports.createProxy = function(opts, request, done) {
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

module.exports.deployProxy = function(opts, request, done) {
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

module.exports.unzipProxy = function(opts, destDir, ignoreDir, cb) {
  
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
        if (entry.path.indexOf(ignoreDir) === 0) {
          if (opts.debug) { console.log('skipping', entry.path); }
          entry.autodrain(); // ignore all hosted resources
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

module.exports.handleUploadResult = handleUploadResult;

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

module.exports.copyFile = function(source, target, cb) {
    
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

function proxyCreationDone (err, req, body, opts, done) {
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