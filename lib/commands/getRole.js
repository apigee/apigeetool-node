/* jshint node: true  */
'use strict';

var util = require('util');
var _ = require('underscore');

var defaults = require('../defaults');
var options = require('../options');
var command_utils = require('./command-utils')

var descriptor = defaults.defaultDescriptor({
  roleName: {
    name: 'Role Name',
    required: true,
    prompt: true
  }
});

module.exports.descriptor = descriptor;

module.exports.run = function(opts, cb) {  
  if (opts.debug) {
    console.log('getRole: %j', opts);
  }
  var uri = util.format('%s/v1/organizations/%s/userroles/%s', opts.baseuri, opts.organization, opts.roleName);
  var requestOptions = {
    uri: uri,
    method:'GET',
    json:true
  }
  command_utils.run('getRole', opts,requestOptions,cb)  
};
