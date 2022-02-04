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
    ref_name: {
        name: 'Reference name',
        shortOption: 'n',
        required: false
    }
});

module.exports.descriptor = descriptor;

module.exports.run = function(opts, cb) {  
  if (opts.debug) {
    console.log('getRole: %j', opts);
  }

  var uri = util.format('%s/v1/o/%s/e/%s/references', opts.baseuri, opts.organization, opts.environment);

  if (opts.ref_name) {
      uri = util.format('%s/v1/o/%s/e/%s/references/%s', opts.baseuri, opts.organization, opts.environment, opts.ref_name);     
  }

  var requestOptions = {
    uri: uri,
    method:'GET',
    json:true
  }
  command_utils.run('getReferences', opts,requestOptions,cb)  
};