/* jshint node: true  */
'use strict';

var options = require('./options');

var DefaultDefaults = {};

function ApigeeTool(defaults) {
  this.defaults = (defaults ? defaults : DefaultDefaults);
}
module.exports = ApigeeTool;

ApigeeTool.getPromiseSDK = function(){
  return require('./promisesdk')
}

ApigeeTool.defaults = function(newDefaults) {
  return new ApigeeTool(newDefaults);
};

ApigeeTool.listDeployments = function(opts, cb) {
  var cmd = require('./commands/listdeployments');
  runCommand(cmd, opts, cb);
};

ApigeeTool.deployNodeApp = function(opts, cb) {
  var cmd = require('./commands/deploynodeapp');
  runCommand(cmd, opts, cb);
};

ApigeeTool.deployProxy = function(opts, cb) {
  var cmd = require('./commands/deployproxy');
  runCommand(cmd, opts, cb);
};

ApigeeTool.undeploy = function(opts, cb) {
  var cmd = require('./commands/undeploy');
  runCommand(cmd, opts, cb);
};

ApigeeTool.fetchProxy = function(opts, cb) {
  var cmd = require('./commands/fetchproxy');
  runCommand(cmd, opts, cb);
};

ApigeeTool.getLogs = function(opts, cb) {
  var cmd = require('./commands/getlogs');
  runCommand(cmd, opts, cb);
};

ApigeeTool.delete = function(opts, cb) {
  var cmd = require('./commands/delete');
  runCommand(cmd, opts, cb);
};

ApigeeTool.createcache = function(opts, cb) {
  var cmd = require('./commands/createcache');
  runCommand(cmd, opts, cb);
};

ApigeeTool.deletecache = function(opts, cb) {
  var cmd = require('./commands/deletecache');
  runCommand(cmd, opts, cb);
};

ApigeeTool.createProduct = function(opts, cb) {
  var cmd = require('./commands/createproduct');
  runCommand(cmd, opts, cb);
};

ApigeeTool.deleteProduct = function(opts,cb){
  var cmd = require('./commands/deleteproduct');
  runCommand(cmd, opts, cb);
}

ApigeeTool.createDeveloper = function(opts, cb) {
  var cmd = require('./commands/createdeveloper');
  runCommand(cmd, opts, cb);
};

ApigeeTool.deleteDeveloper = function(opts,cb){
  var cmd = require('./commands/deletedeveloper');
  runCommand(cmd, opts, cb);
}

ApigeeTool.createApp = function(opts, cb) {
  var cmd = require('./commands/createapp');
  runCommand(cmd, opts, cb);
};

ApigeeTool.deleteApp = function(opts,cb){
  var cmd = require('./commands/deleteapp');
  runCommand(cmd, opts, cb);
}

function runCommand(cmd, opts, cb) {
  options.validate(opts, cmd.descriptor, function(err) {
    if (err) {
      cb(err);
      return;
    }
    cmd.run(opts, cb);
  });
}
