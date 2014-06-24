/* jshint node: true  */
'use strict';

var async = require('async');
var fs = require('fs');
var path = require('path');

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
  return arch.generate({ type: 'nodebuffer', compression: zip.DEFLATE });
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
        arch.generate({ type: 'nodebuffer', compression: zip.DEFLATE });
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
