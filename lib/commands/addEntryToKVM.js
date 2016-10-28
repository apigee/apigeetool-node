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
  mapName:{
    name:'Map Name',
    required: true
  },
  entryName: {
    name:'Entry Name',
    required: true
  },
  entryValue: {
    name:'Entry Value',
    required: true
  }

});

module.exports.descriptor = descriptor;

module.exports.run = function(opts, cb) {
  if (opts.debug) {
    console.log('addEntryToKVM: %j', opts);
  }  
  var payload  = {
		  "name" : opts.entryName,
      "value": opts.entryValue		  
	}
  //this will work only for CPS orgs
	//var payload = {"name":opts.mapName,"entry":[{"name":opts.entryName,"value":opts.entryValue}]}
	var uri = util.format('%s/v1/o/%s/e/%s/keyvaluemaps/%s/entries', opts.baseuri, opts.organization, opts.environment,opts.mapName);
	var requestOpts = {
		uri: uri,
		method:'POST',
		body: payload,
		json:true
	}	
	command_utils.run('addEntryToKVM',opts, requestOpts, cb)  
};
