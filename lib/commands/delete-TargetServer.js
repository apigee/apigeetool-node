/* jshint node: true  */
'use strict';

var util = require('util');
var _ = require('underscore');

var defaults = require('../defaults');
var options = require('../options');
var command_utils = require('./command-utils')

var descriptor = defaults.defaultDescriptor({
  environment: {
    name: 'Environment',
    shortOption: 'e',
    required: true
  },
  targetServerName: {
    name: 'Target Server Name',
    required: true
  }
});

module.exports.descriptor = descriptor;

module.exports.run = function(opts, cb) {  
  if (opts.debug) {
    console.log('deleteTargetServer: %j', opts);
  }
  var uri = util.format('%s/v1/o/%s/e/%s/targetservers/%s', opts.baseuri, opts.organization, opts.environment,opts.targetServerName);
  var requestOptions = {
    uri: uri,
    method:'DELETE',
    json:false
  }
  command_utils.run('deleteTargetServer', opts,requestOptions,cb)  
};
