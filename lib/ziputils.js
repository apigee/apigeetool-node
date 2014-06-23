/* jshint node: true  */
'use strict';

var fs = require('fs');

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
