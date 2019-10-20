/* jshint node: true  */
'use strict';

var util = require('util');
var _ = require('underscore');

var defaults = require('../defaults');
var options = require('../options');
var command_utils = require('./command-utils')

var DefaultPublicCloudScopedKVM = true;

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
  },
  entryName: {
    name:'Entry Name',
    required: true,
    prompt: true
  },
  entryValue: {
    name:'Entry Value',
    required: true,
    prompt: true
  },
  publicCloudScopedKVM: {
    name:'Public cloud (CPS) scoped KVM'    
  }
});

var DefaultOptions = {
  publicCloudScopedKVM: DefaultPublicCloudScopedKVM
};

module.exports.descriptor = descriptor;

module.exports.run = function(opts, cb) {
  if (opts.debug) {
    console.log('addEntryToKVM: %j', opts);
  }  
  for (var n in DefaultOptions) {
    if(!opts[n]) {
      opts[n] = DefaultOptions[n];
    }
  }
  var payload;
  var uri;
  if(String(opts.publicCloudScopedKVM).toLowerCase == 'true') {
    payload  = {
		  "name" : opts.entryName,
      "value": opts.entryValue		  
    }
    uri = util.format('%s/v1/o/%s/keyvaluemaps/%s/entries', opts.baseuri, opts.organization, opts.mapName);
  
    if (opts.api) {
      uri = util.format('%s/v1/o/%s/apis/%s/keyvaluemaps/%s/entries', opts.baseuri, opts.organization, opts.api, opts.mapName);
    }

    if (opts.environment) {
      uri = util.format('%s/v1/o/%s/e/%s/keyvaluemaps/%s/entries', opts.baseuri, opts.organization, opts.environment, opts.mapName);
    }

  } else {
    payload  = {
      "name": opts.mapName,
      "entry": [
        {
          "name" : opts.entryName,
          "value": opts.entryValue		  
        }
      ]
    }
    uri = util.format('%s/v1/o/%s/keyvaluemaps/%s', opts.baseuri, opts.organization, opts.mapName);
  
    if (opts.api) {
      uri = util.format('%s/v1/o/%s/apis/%s/keyvaluemaps/%s', opts.baseuri, opts.organization, opts.api, opts.mapName);
    }

    if (opts.environment) {
      uri = util.format('%s/v1/o/%s/e/%s/keyvaluemaps/%s', opts.baseuri, opts.organization, opts.environment, opts.mapName);
    }
  }  
  
	var requestOpts = {
		uri: uri,
		method:'POST',
		body: payload,
		json:true
	}	
	command_utils.run('addEntryToKVM',opts, requestOpts, cb)  
};
