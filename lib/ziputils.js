/* jshint node: true  */
'use strict';

var async = require('async');
var fs = require('fs');
var path = require('path');
var util = require('util');
var _ = require('underscore');

var zip = require('node-zip');

/*
 * Given a single buffer or string, create a ZIP file containing it
 * and return it as a Buffer.
 */
module.exports.makeOneFileZip = function(dirName, entryName, contents) {
  var arch = new zip();
  if (dirName) {
    arch.folder(dirName).file(entryName, contents);
  } else {
    arch.file(entryName, contents);
  }
  return arch.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
};

/*
 * Turn a whole directory into a ZIP, with entry names relative to the
 * original directory root. Do it asynchronously and return the result in the
 * standard (err, result) callback format.
 */
module.exports.zipDirectory = function(dirName, prefix, cb) {
  if (typeof prefix === 'function') {
    cb = prefix;
    prefix = undefined;
  }

  var pf = (prefix ? prefix : '.');
  var arch = new zip();
  zipDirectory(arch, dirName, pf, function(err) {
    if (err) {
      cb(err);
    } else {
      var contents =
        arch.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
      cb(undefined, contents);
    }
  });
};

function zipDirectory(baseArch, baseName, entryName, done) {
  // Create an object that is now relative to the last ZIP entry name
  var arch = baseArch.folder(entryName);

  fs.readdir(baseName, function(err, files) {
    if (err) {
      done(err);
      return;
    }

    // Iterate over each file in the directory
    async.eachSeries(files, function(fileName, itemDone) {
      var fn = path.join(baseName, fileName);
      fs.stat(fn, function(err, stat) {
        if (err) {
          itemDone(err);
        } else if (stat.isDirectory()) {
          // Recursively ZIP additional directories
          zipDirectory(arch, fn, fileName, itemDone);

        } else if (stat.isFile()) {
          // Aysynchronously read the file and store it in the ZIP.
          fs.readFile(fn, function(err, contents) {
            if (err) {
              itemDone(err);
            } else {
              arch.file(fileName, contents);
              itemDone();
            }
          });
        }
      });
    }, function(err) {
      done(err);
    });
  });
}

/*
 * Given a base directory, produce a list of entries. Each entry has a name,
 * a fully-qualified path, and whether it is a directory. The base is
 * assumed to be a "resources" directory, and the "node" resources folder,
 * if present, will be treated specially using "enumerateNodeDirectory" below.
 */
module.exports.enumerateResourceDirectory = function(baseDir, remoteNpm) {
  var fileList = [];
  var types = fs.readdirSync(baseDir);
  _.each(types, function(type) {
    var fullName = path.join(baseDir, type);
    var stat = fs.statSync(fullName);
    if (stat.isDirectory()) {
      visitDirectory(fullName, fileList, '', '',
                     type, (type === 'node'), remoteNpm);
    }
  });
  return fileList;
};

/*
 * Given a base directory, produce a list of entries. Each entry has a name,
 * a fully-qualified path, and whether it is a directory. This method has
 * special handling for the "node_modules" directory, which it will introspect
 * one level deeper. The result can be used to ZIP up a node.js "resources/node"
 * directory.
 */
module.exports.enumerateNodeDirectory = function(baseDir, remoteNpm, cb) {
  try {
    var fileList = [];
    visitDirectory(baseDir, fileList, '', '', 'node', true, remoteNpm);
    cb(undefined, fileList);
  } catch (err) {
    cb(err);
  }
};

// Examine each file in the directory and produce a result that may be
// used for resource uploading later.
// Skip special files like symbolic links -- we can't handle them.
function visitDirectory(dn, fileList, resourceNamePrefix,
                        zipEntryPrefix, resourceType, isNode, remoteNpm) {

  function addResource(resource) {
    fileList.forEach(function(element) {
      if (element.resourceName === resource.resourceName) {
        throw new Error(
          util.format('File "%s" conflicts with generated resource. Please remove and try again.', resource.fileName));
      }
    });
    fileList.push(resource);
  }

  var files = fs.readdirSync(dn);
  _.each(files, function(file) {
    var fullName = path.join(dn, file);
    var stat = fs.statSync(fullName);
    if (stat.isFile()) {
      addResource({
        fileName: fullName,
        resourceType: resourceType,
        resourceName: resourceNamePrefix + file,
        zipEntryName: zipEntryPrefix + file
        });

    } else if (stat.isDirectory()) {
      if (isNode && (file === 'node_modules')) {
        if (remoteNpm !== true) {
          // Special treatment for node_modules, to break them up into lots of smaller zips.
          // That is unless we are running NPM remotely.
          visitDirectory(fullName, fileList, 'node_modules_',
                        'node_modules/', resourceType, false, remoteNpm);
        }
      } else if (!/^\..+/.test(file)) { // Don't push directories that start with a "." like ".git"!

        if (resourceNamePrefix !== 'node_modules_') {
          var prefix = resourceNamePrefix + file + '/';
          visitDirectory(fullName, fileList, prefix, '', resourceType, false, remoteNpm);
        } else {
          addResource({
              fileName: fullName,
              resourceType: resourceType,
              resourceName: resourceNamePrefix + file + '.zip',
              zipEntryName: zipEntryPrefix + file,
              directory: true });
        }
      }
    }
  });
  return fileList;
}
