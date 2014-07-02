/* jshint node: true  */
'use strict';

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
  }
};

module.exports.printCommandHelp = function() {
  console.error('Valid commands:');
  for (var n in Commands) {
    console.error('%s\t%s', n, Commands[n].description);
  }
};

module.exports.getCommand = function(n) {
  return Commands[n];
};
