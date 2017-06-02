var defaults 	= require('../defaults')
var request	= require('request')
var util	= require('util')

module.exports.run = function(command, opts, requestOpts,done){
	if (opts.verbose) {
		console.log('running command ' + command)
	}	
	var request = defaults.defaultRequest(opts);
	request(requestOpts,function(err,res,body){
		var jsonBody = body    
	    if(err){
	      done(err)
	    }else if (res.statusCode == 200 || res.statusCode == 201) {
	      if (opts.verbose) {
	           console.log(command + ' successful');
	          }
	        if (opts.debug) {
	           console.log('%s', body);
	        }
	          done(undefined, jsonBody);
	    }else {
	        if (opts.verbose) {
	          console.error(command + ' result: %j', body);
	        }
	        var errMsg;
	        if (jsonBody && (jsonBody.message)) {
	          errMsg = jsonBody.message;
	        } else {
	          errMsg = util.format(command + ' failed with status code %d', res.statusCode);
	        }
	        done(new Error(errMsg));
	      }
	})
}
