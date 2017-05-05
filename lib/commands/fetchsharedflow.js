/* jshint node: true  */
'use strict';

var fs = require('fs');
var request = require('request');
var util = require('util');

var defaults = require('../defaults');
var options = require('../options');
var parseDeployments = require('./parsedeployments');

// FIXME: If you specify both org and env, org becomes env
var descriptor = defaults.defaultDescriptor({
  name: {
    name: 'Shared Flow Name',
    shortOption: 'n',
    required: true
  },
  revision: {
    name: 'Revision',
    shortOption: 'r',
    required: true
  },
  file: {
    name: 'fileName',
    shortOption: 'f'
  }
});

module.exports.descriptor = descriptor;

module.exports.run = function (opts, cb) {
  var uri;

  options.validateSync(opts, descriptor);
  if (opts.debug) {
    console.log('fetchSharedFlow: %j', opts);
  }

  if (opts.name && opts.revision) {
    uri = util.format('%s/v1/o/%s/sharedflows/%s/revisions/%s?format=bundle',
      opts.baseuri, opts.organization, opts.name, opts.revision);
  } else {
    cb(new Error('org, sharedflow name, and revision must all be specified! ' + JSON.stringify(opts)));
    return;
  }

  // Call the standard "deployments" API to get the list of what's deployed
  var request = defaults.defaultRequest(opts);
  if (opts.debug) {
    console.log('Going to invoke "%s"', uri);
  }

  //let's default to apiname.zip for the file to save
  var f = (opts.file) ? opts.file : opts.name + '.zip';

  request.get({uri: uri, encoding: 'binary'}, function (err, res, body) {
    if (err) {
      cb(err);
    } else {
      if (opts.debug) {
        console.log('Received: ' + res.statusCode + ' the following headers: ' + JSON.stringify(res.headers));
      }
      if (res.statusCode !== 200) {
        cb(new Error(util.format('Received error %d when fetching shared flow: %s',
          res.statusCode, body)));
      } else {
        fs.writeFile(f, body, 'binary', function (err) {
          if (err) {
            console.log("Failed to write file: " + f);
            console.log("Error text: " + err);
          }
          else {
            console.log('Save file: ' + f);
          }
          cb(err);
        });
      }
    }
  });
};
