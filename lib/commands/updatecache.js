/* jshint node: true  */
'use strict';

var util = require('util');

var defaults = require('../defaults');
var command_utils = require('./command-utils')

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
  },
  description: {
    name: 'Cache description',
    required: false
  },
  cacheExpiryByDate: {
    name: 'Cache expiration by date (mm-dd-yyyy)',
    required: false
  },
  cacheExpiryInSecs: {
    name: 'Cache expiration in seconds',
    required: false
  }
});

module.exports.descriptor = descriptor;

module.exports.run = function(opts, cb) {
  if (opts.debug) {
    console.log('update: %j', opts);
  }

  var updateCachePayload = {
    "compression": {
      "minimumSizeInKB": 512
    },
    "description": opts.description ? opts.description : "Store Response",
    "diskSizeInMB": 1024,
    "distributed": true,
    "expirySettings": {
      "expiryDate": {
        "value": "12-31-9999"
      },
      "valuesNull": false
    },
    "inMemorySizeInKB": 1024,
    "maxElementsInMemory": 100,
    "maxElementsOnDisk": 100,
    "name": opts.cache,
    "overflowToDisk": true,
    "persistent": true,
    "skipCacheIfElementSizeInKBExceeds": 512
  }

  if (opts.cacheExpiryByDate) {
    updateCachePayload.expirySettings.expiryDate.value = opts.cacheExpiryByDate;
  }
  if (opts.cacheExpiryInSecs) {
    updateCachePayload.expirySettings.timeoutInSec = {
      value: opts.cacheExpiryInSecs
    }
  }

  var uri = util.format('%s/v1/o/%s/e/%s/caches/%s', opts.baseuri, opts.organization, opts.environment, opts.cache);
  var requestOptions = {
    uri: uri,
    method: 'PUT',
    body: updateCachePayload,
    json: true
  }
  command_utils.run('updatecache', opts, requestOptions, cb)
};
