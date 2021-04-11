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
    required: true,
    prompt: true
  },
  flowHookName: {
    name: 'One of: PreProxyFlowHook\n        PreTargetFlowHook\n        PostTargetFlowHook\n        PostProxyFlowHook',
    required: true,
    prompt: true
  },
  sharedFlowName: {
  	name: 'Shared Flow name',
	  required: true,
    prompt: true
  }
});

module.exports.descriptor = descriptor;

module.exports.run = function(opts, cb) {
  if (opts.debug) {
    console.log('attachFlowHook: %j', opts);
  }  
  var payload  = {
		  "continueOnError" : true,
		  "sharedFlow" : opts.sharedFlowName
	}
	if(opts.targetSSL){
		payload.sSLInfo = {enabled: true} 
	}

	var uri = util.format('%s/v1/organizations/%s/environments/%s/flowhooks/%s', opts.baseuri, opts.organization, opts.environment, opts.flowHookName);
	var requestOpts = {
		uri: uri,
		method:'POST',
		body: payload,
		json:true
	}	
	command_utils.run('attachFlowHook',opts, requestOpts, cb)  
};
