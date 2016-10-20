/* jshint node: true  */
'use strict';

var _ = require('underscore');
var Table = require('cli-table');

var options = require('../options');

var Commands = {
  deployproxy: {
    description: 'Deploy API Proxy',
    load: function() {
      return require('./deployproxy');
    }
  },
  deploynodeapp: {
    description: 'Deploy Node.js Application',
    load: function() {
      return require('./deploynodeapp');
    }
  },
  listdeployments: {
    description: 'List Deployments',
    load: function() {
      return require('./listdeployments');
    }
  },
  undeploy: {
    description: 'Undeploy Proxy or Node.js Application',
    load: function() {
      return require('./undeploy');
    }
  },
  fetchproxy: {
    description: 'Download Proxy bundle',
    load: function() {
      return require('./fetchproxy');
    }
  },
  getlogs: {
    description: 'Get Application logs',
    load: function() {
      return require('./getlogs');
    }
  },
  delete: {
    description: 'Delete undeployed Proxy or Node.js Application',
    load: function() {
      return require('./delete');
    }
  },
  createcache: {
    description: 'Create a new Cache Resource in the environment',
    load: function(){
      return require('./createcache')
    }
  },
  deletecache: {
    description: 'Deletes a Cache Resource in the environment',
    load: function(){
      return require('./deletecache')
    }
  },
  createProduct: {
    description: 'Create a new API Product',
    load: function(){
      return require('./createproduct.js')
    }
  },
  deleteProduct: {
    description: 'Delete a API Product',
    load: function(){
      return require('./deleteproduct.js')
    }
  },
  createDeveloper: {
    description: 'Create a new Developer',
    load: function(){
      return require('./createdeveloper.js')
    }
  },
  deleteDeveloper: {
    description: 'Delete a Developer',
    load: function(){
      return require('./deletedeveloper.js')
    }
  },
  createApp: {
    description: 'Create a new App',
    load: function(){
      return require('./createapp.js')
    }
  },
  deleteApp: {
    description: 'Delete a App',
    load: function(){
      return require('./deleteapp.js')
    }
  }

};

module.exports.printCommandHelp = function() {
  console.error();
  console.error('Valid commands:');

  var tab = new Table(options.TableFormat);
  _.each(_.sortBy(_.pairs(Commands)), function(p) {
    tab.push([p[0].toString(), p[1].description]);
  });
  console.error(tab.toString());
};

module.exports.getCommand = function(n) {
  return Commands[n];
};
