/* jshint node: true  */
'use strict';

var options = require('./options');
var q = require('q')

var DefaultDefaults = {};

function ApigeeTool(defaults) {
  this.defaults = (defaults ? defaults : DefaultDefaults);  
}

module.exports = ApigeeTool;

ApigeeTool.defaults = function(newDefaults) {
  var tool= new ApigeeTool(newDefaults);
  return tool;
};

ApigeeTool.listDeployments = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/listdeployments');
  runCommand(cmd, opts, cb);
  return cb.promise
};

ApigeeTool.deployNodeApp = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/deploynodeapp');
  runCommand(cmd, opts, cb);
  return cb.promise
};

ApigeeTool.deployProxy = function(opts) {
  console.log('deploy proxy promise')
  var cb = q.defer()
  var cmd = require('./commands/deployproxy');
  runCommand(cmd, opts, cb);
  return cb.promise
};

ApigeeTool.undeploy = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/undeploy');
  runCommand(cmd, opts, cb);
  return cb.promise
};

ApigeeTool.fetchProxy = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/fetchproxy');
  runCommand(cmd, opts, cb);
  return cb.promise
};

ApigeeTool.getLogs = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/getlogs');
  runCommand(cmd, opts, cb);
  return cb.promise
};

ApigeeTool.delete = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/delete');
  runCommand(cmd, opts, cb);
  return cb.promise
};

ApigeeTool.createcache = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/createcache');
  runCommand(cmd, opts, cb);
  return cb.promise
};

ApigeeTool.deletecache = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/deletecache');
  runCommand(cmd, opts, cb);
  return cb.promise
};

ApigeeTool.createApp = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/createapp');
  runCommand(cmd, opts, cb);
  return cb.promise
};

ApigeeTool.deleteApp = function(opts){
  var cb = q.defer()
  var cmd = require('./commands/deleteapp');
  runCommand(cmd, opts, cb);
  return cb.promise
}

ApigeeTool.createProduct = function(opts) {
  var cb = q.defer()
  try{
    var cmd = require('./commands/createproduct');  
    runCommand(cmd, opts, cb);
  }
  catch(err){
    console.log(err)
    cb.reject(err)
  }
  return cb.promise
};

ApigeeTool.deleteProduct = function(opts) {
  var cb = q.defer()
  try{
    var cmd = require('./commands/deleteproduct');  
    runCommand(cmd, opts, cb);
  }
  catch(err){
    console.log(err)
    cb.reject(err)
  }
  return cb.promise
};

ApigeeTool.createDeveloper = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/createdeveloper');
  runCommand(cmd, opts, cb);
  return cb.promise
};

ApigeeTool.deleteDeveloper = function(opts){
  var cb = q.defer()
  var cmd = require('./commands/deletedeveloper');
  runCommand(cmd, opts, cb);
  return cb.promise
}


function runCommand(cmd, opts, cb) {
  options.validate(opts, cmd.descriptor, function(err) {
    if (err) {
      cb.reject(err)
      return;
    }
    cmd.run(opts, function(runerr,response){
      if(runerr){cb.reject(runerr)}
      else { cb.resolve(response)} 
    });
  });
}
