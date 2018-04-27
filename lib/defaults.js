/* jshint node: true  */
'use strict';

var request = require('request');
var url = require('url');
var fs = require('fs');
var _ = require('underscore');
var netrc = require('netrc')();

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
    required: true,
    prompt: true
  },
  password: {
    name: 'Password',
    shortOption: 'p',
    required: true,
    prompt: true,
    secure: true
  },
  header: {
    name: 'Header',
    shortOption: 'H',
    required: false,
    prompt: false,
    multiple: true
  },
  token: {
    name: 'Token',
    shortOption: 't',
    required: true,
    prompt: false
  },
  netrc: {
    name: 'netrc',
    shortOption: 'N',
    required: false,
    toggle: true
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
    shortOption: 'V',
    toggle: true
  },
  json: {
    name: 'JSON',
    shortOption: 'j',
    toggle: true
  },
  cafile: {
    name: 'CA file',
    shortOption: 'c'
  },
  insecure: {
    name: 'insecure',
    shortOption: 'k',
    toggle: true
  },
  asynclimit: {
    name: 'Async limit',
    shortOption: 'a',
    type: 'int'
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
  asynclimit: DefaultAsyncLimit
};

module.exports.defaultOptions = function(opts) {
  for (var n in DefaultOptions) {
    if (!opts[n]) {
      opts[n] = DefaultOptions[n];
    }
  }
  if (!opts.organization) {
    opts.organization = process.env['APIGEE_ORGANIZATION'];
  }
  if (opts.netrc) {
    var mgmtUrl = url.parse(opts.baseuri);
    if (netrc[mgmtUrl.hostname]) {
      opts.username = netrc[mgmtUrl.hostname].login;
      opts.password = netrc[mgmtUrl.hostname].password;
    }
  } else if (opts.token) {
    opts.prompt = true;
  } else {
    if (!opts.username) {
      opts.username = process.env['APIGEE_USERNAME'];
    }
    if (!opts.password) {
      opts.password = process.env['APIGEE_PASSWORD'];
    }
  }
};

module.exports.defaultRequest = function(opts) {

  var auth = {};

  if(opts.token){
    auth = {
      bearer: opts.token
    }
  } else {
    if(opts.username && opts.password){
      auth = {
        username: opts.username,
        password: opts.password.getValue()
      }
    }
  }

  var hdrs = {};
  if (opts.header) {
    var header;
    opts.header.forEach(element => {
      header = element.split(":");
      hdrs[header[0]] = header[1];
    });
  }

  var ro = {
    auth: auth,
    json: true,
    headers: hdrs,
    agentOptions: {}
  };

  if (opts.baseuri) {
    var pu = url.parse(opts.baseuri);
    if ((pu.protocol === 'https:') &&
        process.env.https_proxy) {
      opts.proxy = process.env.https_proxy;

    } else if ((pu.protocol === 'http:') &&
        process.env.http_proxy) {
      opts.proxy = process.env.http_proxy;
    }
  }


  if (opts.cafile) {
    var files = opts.cafile.split(','),
        ca = [];

    _.each(files, function(file) {
      ca.push(fs.readFileSync(file))
    });

    ro.agentOptions.ca = ca;
  }

  if (opts.insecure) {
    ro.agentOptions.rejectUnauthorized = false;
    // Skips certificate validation 
    ro.strictSSL = false;
  }

  return request.defaults(ro);
};
