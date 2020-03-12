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
  },
  permissions: {
    name: 'Permissions array for path and verbs',
    required: true,
    prompt: true
  }
});

module.exports.descriptor = descriptor;

module.exports.run = function(opts, cb) {  
  if (opts.debug) {
    console.log('setRolePermissions: %j', opts);
  }

  if( opts.permissions ) {
    var permissions = JSON.parse(opts.permissions);
  }
  var payload  = {
   "resourcePermission" : permissions
  };
  var uri = util.format('%s/v1/o/%s/userroles/%s/resourcepermissions', opts.baseuri, opts.organization, opts.roleName);
  var requestOptions = {
    uri: uri,
    method:'POST',
    body: payload,
    json:true
  } 
  command_utils.run('setRolePermissions', opts,requestOptions,cb)  
};
