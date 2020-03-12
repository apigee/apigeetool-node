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
  }
});

module.exports.descriptor = descriptor;

module.exports.run = function(opts, cb) {
  if (opts.debug) {
    console.log('getFlowHook: %j', opts);
  }  
  if(opts.targetSSL){
    payload.sSLInfo = {enabled: true} 
  }

  var uri = util.format('%s/v1/o/%s/e/%s/flowhooks/%s', opts.baseuri, opts.organization, opts.environment, opts.flowHookName);
  var requestOpts = {
    uri: uri,
    method:'GET',
    json:true
  } 
  command_utils.run('getFlowHook',opts, requestOpts, cb)  
};
