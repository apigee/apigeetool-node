/* jshint node: true  */
'use strict';

var util = require('util');
var _ = require('underscore');

var defaults = require('../defaults');
var options = require('../options');
var command_utils = require('./command-utils')

var descriptor = defaults.defaultDescriptor({
});

module.exports.descriptor = descriptor;

module.exports.run = function(opts, cb) {  
  if (opts.debug) {
    console.log('listRoles: %j', opts);
  }
  var uri = util.format('%s/v1/organizations/%s/userroles', opts.baseuri, opts.organization);
  var requestOptions = {
    uri: uri,
    method:'GET',
    json:true
  }
  command_utils.run('listRoles', opts,requestOptions,cb)  
};
