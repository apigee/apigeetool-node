/* jshint node: true  */
'use strict';

var util = require('util');
var _ = require('underscore');

var defaults = require('../defaults');
var options = require('../options');

var STREAM_DELAY = 5000;

var descriptor = defaults.defaultDescriptor({
  api: {
    name: 'API Name',
    shortOption: 'n',
    required: true
  },
  environment: {
    name: 'Environment',
    shortOption: 'e',
    required: true
  },
  streaming: {
    name: 'Keep Streaming',
    shortOption: 'f',
    toggle: true,
    required: false
  },
  timezone: {
    name: 'Time Zone',
    shortOption: 'z',
    required: false
  }
});
module.exports.descriptor = descriptor;

// This just prevents the command processor from logging "undefined" at the end
module.exports.format = function(r) {
  return '';
};

module.exports.run = function(opts, cb) {
  options.validateSync(opts, descriptor);
  if (opts.debug) {
    console.log('getlogs: %j', opts);
  }

  var request = defaults.defaultRequest(opts);

  var outStream = (opts.stream ? opts.stream : process.stdout);
  if (opts.streaming) {
    makeStreamRequest(request, opts, outStream, cb);
  } else {
    makeOneRequest(request, opts, outStream, cb);
  }
};

function makeOneRequest(request, opts, outStream, cb) {
  var uri = util.format(
    '%s/v1/o/%s/e/%s/apis/%s/cachedlogs/categories/nodejs',
    opts.baseuri, opts.organization, opts.environment,
    opts.api);
  if (opts.timezone) {
    uri += util.format('?tz=%s', opts.timezone);
  }
  var resp = request({
    uri: uri,
    method: 'GET',
    headers: {
      'Accept': 'text/plain'
    }
  });
  resp.on('response', function(httpResp) {
    if (httpResp.statusCode === 200) {
      httpResp.pipe(outStream);
      httpResp.on('end', function() {
        cb();
      });
    } else {
      cb(new Error(util.format('HTTP error %d', httpResp.statusCode)));
    }
  });
  resp.on('error', function(err) {
    console.error(err);
    cb(err);
  });
}

function makeStreamRequest(request, opts, outStream, cb, state) {
  var uri = util.format(
    '%s/v1/o/%s/e/%s/apis/%s/cachedlogs/categories/nodejs?getState=true',
    opts.baseuri, opts.organization, opts.environment,
    opts.api);
  if (state) {
    uri += util.format('&state=%s', state);
  }
  if (opts.timezone) {
    uri += util.format('&tz=%s', opts.timezone);
  }
  var resp = request({
      uri: uri,
      method: 'GET',
      headers: {
        'Accept': 'text/plain'
      }
    },
    function(err, req, body) {
      if (err) {
        cb(err);
      } else if (req.statusCode === 200) {
        // Need to split the log by newlines to find the "state".
        var state;
        body.split('\n').forEach(function(line) {
          // The log ends with "[state BLAHBLAH]" which we need for the next step
          var r = /^\[state (.*)\][\s]*$/.exec(line);
          if (r) {
            state = r[1];
          } else if (line !== '') {
            outStream.write(line + '\n');
          }
        });

        setTimeout(function() {
          makeStreamRequest(request, opts, outStream, cb, state);
        }, STREAM_DELAY);
      } else {
        cb(new Error(util.format('HTTP error %d', req.statusCode)));
      }
    });
}
