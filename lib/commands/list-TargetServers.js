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
  }
});

module.exports.descriptor = descriptor;

module.exports.run = function(opts, cb) {  
  if (opts.debug) {
    console.log('listTargetServers: %j', opts);
  }
  var uri = util.format('%s/v1/o/%s/e/%s/targetservers', opts.baseuri, opts.organization, opts.environment);
  var requestOptions = {
    uri: uri,
    method:'GET',
    json:false
  }
  command_utils.run('listTargetServers', opts,requestOptions,cb)  
};
