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
  targetServerName: {
    name: 'Target Server Name',
    required: true
  },
  targetHost: {
  	name: 'Target Host',
	required: true
  },
  targetEnabled: {
  	name: 'Target Enabled'
  },
  targetPort: {
  	name: 'Target Port',
  	required: true
  },
  targetSSL:{
  	name: 'SSL Info'
  }
});

module.exports.descriptor = descriptor;

module.exports.run = function(opts, cb) {
  if (opts.debug) {
    console.log('createTargetServer: %j', opts);
  }  
  var payload  = {
		  "name" : opts.targetServerName,
		  "host" : opts.targetHost,
		  "isEnabled" : opts.targetEnabled? opts.targetEnabled:true,
		  "port" : opts.targetPort,		  
	}
	if(opts.targetSSL){
		payload.sSLInfo = {enabled: true} 
	}

	var uri = util.format('%s/v1/o/%s/e/%s/targetservers', opts.baseuri, opts.organization, opts.environment);
	var requestOpts = {
		uri: uri,
		method:'POST',
		body: payload,
		json:true
	}	
	command_utils.run('createTargetServer',opts, requestOpts, cb)  
};
