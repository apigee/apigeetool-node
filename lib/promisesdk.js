/* jshint node: true  */
'use strict';

var options = require('./options');
var q = require('q')

var DefaultDefaults = {};

function ApigeeTool(defaults) {
  this.defaults = (defaults ? defaults : DefaultDefaults);
}

module.exports = ApigeeTool;

ApigeeTool.defaults = function(newDefaults) {
  var tool= new ApigeeTool(newDefaults);
  return tool;
};

ApigeeTool.listDeployments = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/listdeployments');
  runCommand(cmd, opts, cb);
  return cb.promise
};

ApigeeTool.listKeystores = function(opts, cb) {
  var cmd = require('./commands/listkeystores');
  runCommand(cmd, opts, cb);
  return cb.promise
};

ApigeeTool.listReferences = function(opts, cb) {
  var cmd = require('./commands/listreferences');
  runCommand(cmd, opts, cb);
  return cb.promise
};

ApigeeTool.listSharedflowDeployments = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/listsharedflowdeployments');
  runCommand(cmd, opts, cb);
  return cb.promise
};

ApigeeTool.deployNodeApp = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/deploynodeapp');
  runCommand(cmd, opts, cb);
  return cb.promise
};

ApigeeTool.deployProxy = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/deployproxy');
  runCommand(cmd, opts, cb);
  return cb.promise
};

ApigeeTool.undeploy = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/undeploy');
  runCommand(cmd, opts, cb);
  return cb.promise
};

ApigeeTool.delete = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/delete');
  runCommand(cmd, opts, cb);
  return cb.promise
};

ApigeeTool.fetchProxy = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/fetchproxy');
  runCommand(cmd, opts, cb);
  return cb.promise
};

ApigeeTool.fetchSharedflow = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/fetchsharedflow');
  runCommand(cmd, opts, cb);
  return cb.promise
};

ApigeeTool.deploySharedflow = function(opts) {
    var cb = q.defer()
    var cmd = require('./commands/deploysharedflow');
    runCommand(cmd, opts, cb);
    return cb.promise
};

ApigeeTool.undeploySharedflow = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/undeploysharedflow');
  runCommand(cmd, opts, cb);
  return cb.promise
};

ApigeeTool.deleteSharedflow = function(opts) {
    var cb = q.defer()
    var cmd = require('./commands/deletesharedflow');
    runCommand(cmd, opts, cb);
    return cb.promise
};

ApigeeTool.getLogs = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/getlogs');
  runCommand(cmd, opts, cb);
  return cb.promise
};

ApigeeTool.getKeystore = function(opts, cb) {
  var cb = q.defer()
  var cmd = require('./commands/getkeystore');
  runCommand(cmd, opts, cb);
  return cb.promise
};

ApigeeTool.deleteKeystore = function(opts, cb) {
  var cb = q.defer()
  var cmd = require('./commands/deletekeystore');
  runCommand(cmd, opts, cb);
  return cb.promise
};

ApigeeTool.getAlias = function(opts, cb) {
  var cb = q.defer()
  var cmd = require('./commands/getalias');
  runCommand(cmd, opts, cb);
  return cb.promise
};

ApigeeTool.getCertificate = function(opts, cb) {
  var cb = q.defer()
  var cmd = require('./commands/getcertificate');
  runCommand(cmd, opts, cb);
  return cb.promise
};

ApigeeTool.getReference = function(opts, cb) {
  var cb = q.defer()
  var cmd = require('./commands/getreference');
  runCommand(cmd, opts, cb);
  return cb.promise
};

ApigeeTool.delete = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/delete');
  runCommand(cmd, opts, cb);
  return cb.promise
};

ApigeeTool.createcache = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/createcache');
  runCommand(cmd, opts, cb);
  return cb.promise
};

ApigeeTool.deletecache = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/deletecache');
  runCommand(cmd, opts, cb);
  return cb.promise
};

ApigeeTool.createApp = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/createapp');
  runCommand(cmd, opts, cb);
  return cb.promise
};

ApigeeTool.deleteApp = function(opts){
  var cb = q.defer()
  var cmd = require('./commands/deleteapp');
  runCommand(cmd, opts, cb);
  return cb.promise
}

ApigeeTool.createProduct = function(opts) {
  var cb = q.defer()
  try{
    var cmd = require('./commands/createproduct');
    runCommand(cmd, opts, cb);
  }
  catch(err){
    cb.reject(err)
  }
  return cb.promise
};

ApigeeTool.deleteProduct = function(opts) {
  var cb = q.defer()
  try{
    var cmd = require('./commands/deleteproduct');
    runCommand(cmd, opts, cb);
  }
  catch(err){
    console.log(err)
    cb.reject(err)
  }
  return cb.promise
};

ApigeeTool.createDeveloper = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/createdeveloper');
  runCommand(cmd, opts, cb);
  return cb.promise
};

ApigeeTool.deleteDeveloper = function(opts){
  var cb = q.defer()
  var cmd = require('./commands/deletedeveloper');
  runCommand(cmd, opts, cb);
  return cb.promise
}

ApigeeTool.createTargetServer = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/create-TargetServer');
  runCommand(cmd, opts, cb);
  return cb.promise
};

ApigeeTool.deleteTargetServer = function(opts){
  var cb = q.defer()
  var cmd = require('./commands/delete-TargetServer');
  runCommand(cmd, opts, cb);
  return cb.promise
}

ApigeeTool.getTargetServer = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/get-TargetServer');
  runCommand(cmd, opts, cb);
  return cb.promise
};

ApigeeTool.listTargetServers = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/list-TargetServers');
  runCommand(cmd, opts, cb);
  return cb.promise
};

ApigeeTool.updateTargetServer = function (opts) {
  var cb = q.defer()
  var cmd = require('./commands/update-TargetServer');
  runCommand(cmd, opts, cb);
  return cb.promise
};

ApigeeTool.createKVM = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/create-KVM');
  runCommand(cmd, opts, cb);
  return cb.promise
};

ApigeeTool.addEntryToKVM = function(opts){
  var cb = q.defer()
  var cmd = require('./commands/addEntryToKVM');
  runCommand(cmd, opts, cb);
  return cb.promise
}

ApigeeTool.getKVMentry = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/getKVMentry');
  runCommand(cmd, opts, cb);
  return cb.promise
}

ApigeeTool.getKVMmap = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/getKVMmap');
  runCommand(cmd, opts, cb);
  return cb.promise
}

ApigeeTool.deleteKVMentry = function(opts){
  var cb = q.defer()
  var cmd = require('./commands/deleteKVMentry');
  runCommand(cmd, opts, cb);
  return cb.promise
}

ApigeeTool.deleteKVM = function(opts){
  var cb = q.defer()
  var cmd = require('./commands/delete-KVM');
  runCommand(cmd, opts, cb);
  return cb.promise
}
ApigeeTool.updateKVMentry = function (opts) {
  var cb = q.defer()
  var cmd = require('./commands/updateKVMentry');
  runCommand(cmd, opts, cb);
  return cb.promise
}

ApigeeTool.deployExistingRevision = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/deployExistingRevision');
  runCommand(cmd, opts, cb);
  return cb.promise
}

ApigeeTool.createAppKey = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/createappkey');
  runCommand(cmd, opts, cb);
  return cb.promise
}

ApigeeTool.attachFlowHook = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/attachFlowHook');
  runCommand(cmd, opts, cb);
  return cb.promise
}

ApigeeTool.detachFlowHook = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/detachFlowHook');
  runCommand(cmd, opts, cb);
  return cb.promise
}

ApigeeTool.getFlowHook = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/getFlowHook');
  runCommand(cmd, opts, cb);
  return cb.promise
}

ApigeeTool.listRoles = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/listRoles');
  runCommand(cmd, opts, cb);
  return cb.promise
}
ApigeeTool.createRole = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/createRole');
  runCommand(cmd, opts, cb);
  return cb.promise
}
ApigeeTool.getRole = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/getRole');
  runCommand(cmd, opts, cb);
  return cb.promise
}
ApigeeTool.deleteRole = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/deleteRole');
  runCommand(cmd, opts, cb);
  return cb.promise
}
ApigeeTool.setRolePermissions = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/setRolePermissions');
  runCommand(cmd, opts, cb);
  return cb.promise
}
ApigeeTool.getRolePermissions = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/getRolePermissions');
  runCommand(cmd, opts, cb);
  return cb.promise
}
ApigeeTool.assignUserRole = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/assignUserRole');
  runCommand(cmd, opts, cb);
  return cb.promise
}
ApigeeTool.removeUserRole = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/removeUserRole');
  runCommand(cmd, opts, cb);
  return cb.promise
}
ApigeeTool.verifyUserRole = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/verifyUserRole');
  runCommand(cmd, opts, cb);
  return cb.promise
}
ApigeeTool.listRoleUsers = function(opts) {
  var cb = q.defer()
  var cmd = require('./commands/listRoleUsers');
  runCommand(cmd, opts, cb);
  return cb.promise
}


function runCommand(cmd, opts, cb) {
  options.validate(opts, cmd.descriptor, function(err) {
    if (err) {
      cb.reject(err)
      return;
    }
    cmd.run(opts, function(runerr,response){
      if(runerr){cb.reject(runerr)}
      else { cb.resolve(response)}
    });
  });
}
