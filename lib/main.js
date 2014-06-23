/* jshint node: true  */
'use strict';

var options = require('./options');

var DefaultDefaults = {};

function ApigeeTool(defaults) {
  this.defaults = (defaults ? defaults : DefaultDefaults);
}
module.exports = ApigeeTool;

ApigeeTool.defaults = function(newDefaults) {
  return new ApigeeTool(newDefaults);
};

ApigeeTool.listDeployments = function(opts, cb) {
  var cmd = require('./commands/listdeployments');
  runCommand(cmd, opts, cb);
};

ApigeeTool.deployProxy = function(opts, cb) {
  var cmd = require('./commands/deployproxy');
  runCommand(cmd, opts, cb);
};

function runCommand(cmd, opts, cb) {
  options.validate(cmd.descriptor, opts, function(err) {
    if (err) {
      cb(err);
      return;
    }
    cmd.run(opts, cb);
  });
}
