/* jshint node: true  */
'use strict';

var request = require('request');

var DefaultBaseURI = 'https://api.enterprise.apigee.com';
var DefaultAsyncLimit = 4;

var DefaultDescriptor = {
  help: {
    name: 'Help',
    shortOption: 'h',
    toggle: true
  },
  username: {
    name: 'Username',
    shortOption: 'u',
    required: true
  },
  password: {
    name: 'Password',
    shortOption: 'p',
    required: true,
    secure: true
  },
  organization: {
    name: 'Organization',
    shortOption: 'o',
    required: true
  },
  baseuri: {
    name: 'Base URI',
    shortOption: 'L'
  },
  debug: {
    name: 'Debug',
    shortOption: 'D',
    toggle: true
  },
  verbose: {
    name: 'Verbose',
    shortOption: 'v',
    toggle: true
  },
  json: {
    name: 'JSON',
    shortOption: 'j',
    toggle: true
  }
};

module.exports.defaultDescriptor = function(opts) {
  var o = {};
  var n;
  for (n in DefaultDescriptor) {
    o[n] = DefaultDescriptor[n];
  }
  for (n in opts) {
    o[n] = opts[n];
  }
  return o;
};

var DefaultOptions = {
  baseuri: DefaultBaseURI,
  asyncLimit: DefaultAsyncLimit
};

module.exports.defaultOptions = function(opts) {
  for (var n in DefaultOptions) {
    if (!opts[n]) {
      opts[n] = DefaultOptions[n];
    }
  }
};

module.exports.defaultRequest = function(opts) {
  return request.defaults({
    auth: {
      username: opts.username,
      password: opts.password
    },
    json: true
  });
};
