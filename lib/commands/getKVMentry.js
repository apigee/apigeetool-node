/* jshint node: true  */
'use strict';

var util = require('util');

var defaults = require('../defaults');
var command_utils = require('./command-utils')

var descriptor = defaults.defaultDescriptor({
  environment: {
    name: 'Environment',
    shortOption: 'e',
    required: true
  },
  mapName:{
    name:'Map Name',
    required: true,
    prompt: true
  },
  entryName: {
    name:'Entry Name',
    required: true,
    prompt: true
  }

});

module.exports.descriptor = descriptor;

module.exports.run = function(opts, cb) {
  if (opts.debug) {
    console.log('getKVMentry: %j', opts);
  }

	var uri = util.format('%s/v1/o/%s/e/%s/keyvaluemaps/%s/entries/%s', opts.baseuri, opts.organization, opts.environment, opts.mapName, opts.entryName);
	var requestOpts = {
		uri: uri,
		method:'GET'
	}	
	command_utils.run('getKVMentry',opts, requestOpts, cb)  
};
