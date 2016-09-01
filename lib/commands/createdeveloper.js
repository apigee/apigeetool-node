/* jshint node: true  */
'use strict';

var util = require('util');
var _ = require('underscore');

var defaults = require('../defaults');
var options = require('../options');

var descriptor = defaults.defaultDescriptor({
  'email': {
    name: 'Developer Email',    
    required: true
  },
  'firstName': {
  	name: 'First Name'
  },
  'lastName': {
    name: 'Last Name',    
    required: true
  },
  'userName':{
  	name: 'User Name',
  	required: true
  }
});

module.exports.descriptor = descriptor;

module.exports.run = function(opts, cb) {
	console.log('running create developer')
  options.validateSync(opts, descriptor);
  if (opts.debug) {
    console.log('createDeveloper: %j', opts);
  }
  var request = defaults.defaultRequest(opts);
  createDeveloper(opts, request, function(err, results) {
      if (err) {
        cb(err);
      } else {
        if (opts.debug) {
          console.log('results: %j', results);
        }
        cb(undefined, {});
      }
    });
};

function createDeveloper(opts,request,done){
	console.log('creating developer')
	var developer = {
	  	"email" : opts.email,
 		"firstName" : opts.firstName,
 		"lastName" : opts.lastName,
 		"userName" : opts.userName  
	}

	var uri = util.format('%s/v1/o/%s/developers', opts.baseuri, opts.organization);
	request({
		uri: uri,
		method:'POST',
		body: developer,
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
       		 console.log('Create successful');
      		}
		    if (opts.debug) {
		       console.log('%s', body);
		    }
      		done(undefined, jsonBody);
		}else {
	      if (opts.verbose) {
	        console.error('Create Developer result: %j', body);
	      }
	      var errMsg;
	      if (jsonBody && (jsonBody.message)) {
	        errMsg = jsonBody.message;
	      } else {
	        errMsg = util.format('Create Developer failed with status code %d', res.statusCode);
	      }
	      done(new Error(errMsg));
    	}
	})
}

