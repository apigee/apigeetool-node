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
  email: {
    name: 'Developer email',
    required: true,
    prompt: true
  }
});

module.exports.descriptor = descriptor;

module.exports.run = function(opts, cb) {  
  if (opts.debug) {
    console.log('assignUserRole: %j', opts);
  }

  var formData = util.format('id=%s', encodeURIComponent(opts.email));
  var uri = util.format('%s/v1/organizations/%s/userroles/%s/users', opts.baseuri, opts.organization, opts.roleName);
  var requestOptions = {
    uri: uri,
    method:'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData,
    json:true
  } 
  command_utils.run('assignUserRole', opts,requestOptions,cb)  
};
