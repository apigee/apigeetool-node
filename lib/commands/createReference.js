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
    required: false
  },
  name: {
    name: 'Reference name',
    shortOption: 'n',
    required: true,
    prompt: true
  },
  refers: {
    name: 'Refers',
    shortOption: 'R',
    required: true,
    prompt: true
  },
  resourceType: {
    name: 'Resource Type',
    shortOption: 'r',
    required: true,
    prompt: true
  },
});

module.exports.descriptor = descriptor;

module.exports.run = function(opts, cb) {
  if (opts.debug) {
    console.log('createReference: %j', opts);
  }  
  var payload = {
    name : opts.name,
    refers : opts.refers,
    resourceType: opts.resourceType
  };
  
  var uri = util.format('%s/v1/o/%s/e/%s/references', opts.baseuri, opts.organization, opts.environment);
  
  var requestOpts = {
    uri: uri,
    method:'POST',
    body: payload,
    json:true
  };

  command_utils.run('createReference',opts, requestOpts, cb);
};
