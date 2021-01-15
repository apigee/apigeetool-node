/* jshint node: true  */
'use strict';

var util = require('util');

var defaults = require('../defaults');
var command_utils = require('./command-utils')

var descriptor = defaults.defaultDescriptor({
  environment: {
    name: 'Environment',
    shortOption: 'e',
    required: false
  },
  api: {
    name: 'API',
    shortOption: 'n',
    required: false
  },
  mapName:{
    name:'Map Name',
    required: true,
    prompt: true
  }
});

module.exports.descriptor = descriptor;

module.exports.run = function(opts, cb) {
  if (opts.debug) {
    console.log('getkvmmap: %j', opts);
  }

  var uri = util.format('%s/v1/o/%s/keyvaluemaps/%s', opts.baseuri, opts.organization, opts.mapName);
  
  if (opts.api) {
    uri = util.format('%s/v1/o/%s/apis/%s/keyvaluemaps/%s', opts.baseuri, opts.organization, opts.api, opts.mapName);
  }

  if (opts.environment) {
    uri = util.format('%s/v1/o/%s/e/%s/keyvaluemaps/%s', opts.baseuri, opts.organization, opts.environment, opts.mapName);
  }

	var requestOpts = {
		uri: uri,
		method:'GET'
	}	
	command_utils.run('getkvmmap',opts, requestOpts, cb)  
};
