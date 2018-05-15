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
};

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

ApigeeTool.deployHostedTarget = function(opts, cb) {
  var cmd = require('./commands/deployhostedtarget');
  runCommand(cmd, opts, cb)
}

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
};

ApigeeTool.createDeveloper = function(opts, cb) {
  var cmd = require('./commands/createdeveloper');
  runCommand(cmd, opts, cb);
};

ApigeeTool.deleteDeveloper = function(opts,cb){
  var cmd = require('./commands/deletedeveloper');
  runCommand(cmd, opts, cb);
};

ApigeeTool.createApp = function(opts, cb) {
  var cmd = require('./commands/createapp');
  runCommand(cmd, opts, cb);
};

ApigeeTool.deleteApp = function(opts,cb){
  var cmd = require('./commands/deleteapp');
  runCommand(cmd, opts, cb);
};

ApigeeTool.createTargetServer = function(opts, cb) {
  var cmd = require('./commands/create-TargetServer');
  runCommand(cmd, opts, cb);
};

ApigeeTool.deleteTargetServer = function(opts,cb){
  var cmd = require('./commands/delete-TargetServer');
  runCommand(cmd, opts, cb);
};

ApigeeTool.createKVM = function(opts, cb) {
  var cmd = require('./commands/create-KVM');
  runCommand(cmd, opts, cb);
};

ApigeeTool.getkvmmap = function(opts, cb) {
  var cmd = require('./commands/getkvmmap');
  runCommand(cmd, opts, cb);
};

ApigeeTool.getKVMentry = function(opts, cb) {
  var cmd = require('./commands/getKVMentry');
  runCommand(cmd, opts, cb);
};

ApigeeTool.addEntryToKVM = function(opts,cb){
  var cmd = require('./commands/addEntryToKVM');
  runCommand(cmd, opts, cb);
};

ApigeeTool.deleteKVM = function(opts,cb){
  var cmd = require('./commands/delete-KVM');
  runCommand(cmd, opts, cb);
};

ApigeeTool.deleteKVMentry = function(opts,cb){
  var cmd = require('./commands/deleteKVMentry');
  runCommand(cmd, opts, cb);
}

ApigeeTool.deploySharedflow = function (opts, cb) {
  var cmd = require('./commands/deploysharedflow.js');
  runCommand(cmd, opts, cb);
};

ApigeeTool.undeploySharedflow= function (opts, cb) {
  var cmd = require('./commands/undeploysharedflow.js');
  runCommand(cmd, opts, cb);
};

ApigeeTool.fetchSharedflow = function (opts, cb) {
  var cmd = require('./commands/fetchsharedflow.js');
  runCommand(cmd, opts, cb);
};

ApigeeTool.listSharedflowDeployments = function (opts, cb) {
  var cmd = require('./commands/listsharedflowdeployments.js');
  runCommand(cmd, opts, cb);
};

ApigeeTool.deleteSharedflow = function (opts, cb) {
  var cmd = require('./commands/deletesharedflow.js');
  runCommand(cmd, opts, cb);
};

function runCommand(cmd, opts, cb) {
  options.validate(opts, cmd.descriptor, function(err) {
    if (err) {
      cb(err);
      return;
    }
    cmd.run(opts, cb);
  });
}
