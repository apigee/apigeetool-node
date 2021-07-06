/* jshint node: true  */
'use strict';

var _ = require('underscore');
var Table = require('cli-table');

var options = require('../options');

var Commands = {
  attachFlowHook: {
    description: 'Attach a Shared Flow to a Flow Hook',
    load: function() {
      return require('./attachFlowHook');
    }
  },
  detachFlowHook: {
    description: 'Detach a Shared Flow from a Flow Hook',
    load: function() {
      return require('./detachFlowHook');
    }
  },
  getFlowHook: {
    description: 'Get the Shared Flow attached to a Flow Hook',
    load: function() {
      return require('./getFlowHook');
    }
  },
  createTargetServer: {
    description: 'Create a Target Server',
    load: function() {
      return require('./create-TargetServer');
    }
  },
  deleteTargetServer: {
    description: 'Delete a Target Server',
    load: function() {
      return require('./delete-TargetServer');
    }
  },
  getTargetServer: {
    description: 'Get a Target Server',
    load: function() {
      return require('./get-TargetServer');
    }
  },
  listTargetServers: {
    description: 'List Target Servers',
    load: function() {
      return require('./list-TargetServers');
    }
  },
  createkvmmap: {
    description: 'Create a KVM map',
    load: function() {
      return require('./create-KVM');
    }
  },
  addEntryToKVM: {
    description: 'Add an entry to a KVM map',
    load: function() {
      return require('./addEntryToKVM');
    }
  },
  updateKVMEntry: {
    description: "Updates an entry in a KVM map",
    load: function () {
      return require('./updateKVMEntry');
    }
  },
  getKVMentry: {
    description: 'Get an unencrypted KVM entry',
    load: function() {
      return require('./getKVMentry');
    }
  },
  getkvmmap: {
    description: 'Get a KVM map',
    load: function() {
      return require('./getkvmmap');
    }
  },
  deleteKVMentry: {
    description: 'Delete a single KVM entry',
    load: function() {
      return require('./deleteKVMentry');
    }
  },
  deletekvmmap: {
    description: 'Delete an entire KVM map',
    load: function() {
      return require('./delete-KVM');
    }
  },
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
  deployhostedtarget: {
    description: 'Deploy application as a Hosted Target proxy',
    load: function() {
      return require('./deployhostedtarget');
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
      return require('./createcache');
    }
  },
  deletecache: {
    description: 'Deletes a Cache Resource in the environment',
    load: function(){
      return require('./deletecache');
    }
  },
  createProduct: {
    description: 'Create a new API Product',
    load: function(){
      return require('./createproduct.js');
    }
  },
  deleteProduct: {
    description: 'Delete a API Product',
    load: function(){
      return require('./deleteproduct.js');
    }
  },
  createDeveloper: {
    description: 'Create a new Developer',
    load: function(){
      return require('./createdeveloper.js');
    }
  },
  deleteDeveloper: {
    description: 'Delete a Developer',
    load: function(){
      return require('./deletedeveloper.js');
    }
  },
  createApp: {
    description: 'Create a new App',
    load: function(){
      return require('./createapp.js');
    }
  },
  deleteApp: {
    description: 'Delete a App',
    load: function(){
      return require('./deleteapp.js');
    }
  },
  deploySharedflow: {
    description: 'Deploy SharedFlow',
    load: function () {
      return require('./deploysharedflow.js');
    }
  },
  undeploySharedflow: {
    description: "Undeploy SharedFlow",
    load: function () {
      return require('./undeploysharedflow.js');
    }
  },
  fetchSharedflow: {
    description: "Download SharedFlow bundle",
    load: function () {
      return require('./fetchsharedflow.js');
    }
  },
  listSharedflowDeployments: {
    description: "List SharedFlow deployments",
    load: function () {
      return require('./listsharedflowdeployments');
    }
  },
  deleteSharedflow: {
    description: "Delete undeployed SharedFlow",
    load: function () {
      return require('./deletesharedflow.js');
    }
  },
  deployExistingRevision: {
    description: "Deploy an existing revision to an environment",
    load: function () {
      return require('./deployExistingRevision');
    }
  },
  listRoles: {
    description: "List roles in an organziation",
    load: function () {
      return require('./listRoles');
    }
  },
  createRole: {
    description: "Create a userrole in an organziation",
    load: function () {
      return require('./createRole');
    }
  },
  getRole: {
    description: "Get a userrole in an organziation",
    load: function () {
      return require('./getRole');
    }
  },
  deleteRole: {
    description: "Delete a userrole in an organziation",
    load: function () {
      return require('./deleteRole');
    }
  },
  getRolePermissions: {
    description: "Get resource permissions for a role",
    load: function () {
      return require('./getRolePermissions');
    }
  },
  setRolePermissions: {
    description: "Set resource permissions for a role",
    load: function () {
      return require('./setRolePermissions');
    }
  },
  assignUserRole: {
    description: "Assign user to a role",
    load: function () {
      return require('./assignUserRole');
    }
  },
  removeUserRole: {
    description: "Remove user from a role",
    load: function () {
      return require('./removeUserRole');
    }
  },
  verifyUserRole: {
    description: "Verify a user is in a role",
    load: function () {
      return require('./verifyUserRole');
    }
  },
  listRoleUsers: {
    description: "List users in role",
    load: function () {
      return require('./listRoleUsers');
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
  var command = _.findKey(Commands, function(val, key) {
      return key.toLowerCase() === n.toLowerCase();
  });
  return Commands[command]
};
