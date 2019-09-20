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
    console.log('createRole: %j', opts);
  }
  var payload  = {
   "role" : [ 
     {"name" : opts.roleName}
   ]
  };
  
  var uri = util.format('%s/v1/o/%s/userroles', opts.baseuri, opts.organization);
  var requestOptions = {
    uri: uri,
    method:'POST',
    body: payload,
    json:true
  } 
  command_utils.run('createRole', opts,requestOptions,cb)  
};
