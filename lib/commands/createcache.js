/* jshint node: true  */
'use strict';

var util = require('util');
var _ = require('underscore');

var defaults = require('../defaults');
var options = require('../options');

var descriptor = defaults.defaultDescriptor({
  environment: {
    name: 'Environment',
    shortOption: 'e',
    required: true
  },
  cache: {
    name: 'Cache Resource',
    shortOption: 'z',
    required: true
  }
});

module.exports.descriptor = descriptor;

module.exports.run = function(opts, cb) {
  options.validateSync(opts, descriptor);
  if (opts.debug) {
    console.log('createcache: %j', opts);
  }
  var request = defaults.defaultRequest(opts);
  createCache(opts, request, function(err, results) {
      if (err) {
        cb(err);
      } else {
        if (opts.debug) {
          console.log('results: %j', results);
        }
        cb(undefined, results);
      }
    });
};

function createCache(opts, request, done){
	var createCachePayload  = {
		  "compression" : {
		    "minimumSizeInKB" : 512
		  },
		  "description" : "Store Response",
		  "diskSizeInMB" : 1024,
		  "distributed" : true,
		  "expirySettings" : {
		    "expiryDate" : {
		      "value" : "12-31-9999"
		    },
		    "valuesNull" : false
		  },
		  "inMemorySizeInKB" : 1024,
		  "maxElementsInMemory" : 100,
		  "maxElementsOnDisk" : 100,
		  "name" : opts.cache,
		  "overflowToDisk" : true,
		  "persistent" : true,
		  "skipCacheIfElementSizeInKBExceeds" : 512
	}

	var uri = util.format('%s/v1/o/%s/e/%s/caches', opts.baseuri, opts.organization, opts.environment);
	request({
		uri: uri,
		method:'POST',
		body: createCachePayload,
		json:true
	},function(err,res,body){
		var jsonBody = body
		if(err){
			if (opts.debug) {
		       console.log('Error occured %s', err);
		    }
			done(err)
		}else if (res.statusCode === 201) {
			if (opts.verbose) {
       		 console.log('Delete successful');
      		}
		    if (opts.debug) {
		       console.log('%s', body);
		    }
      		done(undefined, jsonBody);
		}else {
	      if (opts.verbose) {
	        console.error('Create Cache result: %j', body);
	      }
	      var errMsg;
	      if (jsonBody && (jsonBody.message)) {
	        errMsg = jsonBody.message;
	      } else {
	        errMsg = util.format('Create Cache failed with status code %d', res.statusCode);
	      }
	      done(new Error(errMsg));
    	}
	})
}
