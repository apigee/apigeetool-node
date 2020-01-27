/* jshint node: true  */
'use strict';

var util = require('util');
var _ = require('underscore');

var defaults = require('apigeetool/lib/defaults');
var options = require('apigeetool/lib/options');
var command_utils = require('apigeetool/lib/commands/command-utils')

var descriptor = defaults.defaultDescriptor({
    environments: {
        name: 'Environments',
        shortOption: 'e',
        required: true,
        prompt: true
    },
    targetServerName: {
        name: 'Target Server Name',
        required: true,
        prompt: true
    },
    targetHost: {
        name: 'Target Host',
        required: true,
        prompt: true
    },
    targetEnabled: {
        name: 'Target Enabled'
    },
    targetPort: {
        name: 'Target Port',
        required: true,
        prompt: true
    },
    targetSSL: {
        name: 'SSL Info'
    }
});

module.exports.descriptor = descriptor;

module.exports.run = function (opts, cb) {
    if (opts.debug) {
        console.log('updateTargetServer: %j', opts);
    }
    var payload = {
        "name": opts.targetServerName,
        "host": opts.targetHost,
        "isEnabled": opts.targetEnabled ? opts.targetEnabled : true,
        "port": opts.targetPort,
    }
    if (opts.targetSSL) {
        payload.sSLInfo = { enabled: true }
    }

    var uri = util.format('%s/v1/organizations/%s/environments/%s/targetservers/%s', opts.baseuri, opts.organization, opts.environments, opts.targetServerName);
    console.log(uri)
    var requestOpts = {
        uri: uri,
        method: 'PUT',
        body: payload,
        json: true
    }
    command_utils.run('updateTargetServer', opts, requestOpts, cb)
};
