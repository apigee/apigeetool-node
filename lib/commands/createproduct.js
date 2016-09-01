/* jshint node: true  */
'use strict';

var util = require('util');
var _ = require('underscore');

var defaults = require('../defaults');
var options = require('../options');

var descriptor = defaults.defaultDescriptor({
  'productName': {
    name: 'Product Name',    
    required: true
  },
  'productDesc': {
  	name: 'Description'
  },
  'proxies': {
    name: 'API Proxies',    
    required: true
  },
  'environments':{
  	name: 'Environments',
  	required: true
  },
  'approvalType': {
  	name: 'Approval Type',
  	required: true
  },
  'quota' : {
  	name: 'Quota',  	
  },
  'quotaInterval':{
  	name: 'Quota Interval'
  },
  'quotaTimeUnit': {
  	name:'Quota Time Unit'
  }
});

module.exports.descriptor = descriptor;

module.exports.run = function(opts, cb) {
	console.log('running create product')
  options.validateSync(opts, descriptor);
  if (opts.debug) {
    console.log('createProduct: %j', opts);
  }
  var request = defaults.defaultRequest(opts);
  createProduct(opts, request, function(err, results) {
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

function createProduct(opts,request,done){
	console.log('creating product')
	var product = {
	  "approvalType": "auto", 
	  "attributes":
	    [ {"name": "access", "value": "public"} ],	  
	  "scopes": []	  
	}
	product.name = opts.productName
	product.displayName = opts.productName
	product.description = opts.productDesc
	product.proxies = []
	if(opts.proxies){
		var split = opts.proxies.split(',')
		split.forEach(function(s){
			if(s && s.trim()!= '') {
				product.proxies.push(s.trim())
			}
		})
	}
	product.environments = [] 
	if(opts.environments){
		var split = opts.environments.split(',')
		split.forEach(function(s){
			if(s && s.trim()!= '') {
				product.environments.push(s.trim())
			}
		})
	}
	if(opts.quota && opts.quotaInterval && opts.quotaTimeUnit){
		product.quota = opts.quota
		product.quotaInterval = opts.quotaInterval
		product.quotaTimeUnit = opts.quotaTimeUnit
	}

	var uri = util.format('%s/v1/o/%s/apiproducts', opts.baseuri, opts.organization);
	request({
		uri: uri,
		method:'POST',
		body: product,
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
	        console.error('Create Product result: %j', body);
	      }
	      var errMsg;
	      if (jsonBody && (jsonBody.message)) {
	        errMsg = jsonBody.message;
	      } else {
	        errMsg = util.format('Create Product failed with status code %d', res.statusCode);
	      }
	      done(new Error(errMsg));
    	}
	})
}

