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
   keystoreName:{
    name:'Keystore Name',
    required: true,
    prompt: true
  }
});

module.exports.descriptor = descriptor;

module.exports.run = function(opts, cb) {  
  if (opts.debug) {
    console.log('deleteKeystore: %j', opts);
  }
  var uri = util.format('%s/v1/o/%s/e/%s/keystores/%s', opts.baseuri, opts.organization, opts.environment, opts.keystoreName);
  var requestOptions = {
    uri: uri,
    method:'DELETE',
    json:true
  }
  command_utils.run('deleteKeystore', opts,requestOptions,cb)  
};
