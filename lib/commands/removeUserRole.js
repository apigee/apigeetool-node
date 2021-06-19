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
    console.log('removeUserRole: %j', opts);
  }

  var uri = util.format('%s/v1/organizations/%s/userroles/%s/users/%s', opts.baseuri, opts.organization, opts.roleName, opts.email );
  var requestOptions = {
    uri: uri,
    method:'DELETE',
    json:true
  } 
  command_utils.run('removeUserRole', opts,requestOptions,cb)  
};
