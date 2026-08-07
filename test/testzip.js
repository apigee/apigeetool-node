const assert = require('assert'),
      fs = require('fs'),
      ziputils = require('../lib/ziputils');

const LONG_TIMEOUT = 8000;

describe('ZIP Utilities Test', function() {
  it('Create one file archive', function(done) {
    var data = 'Hello, World!';

    assert(data.length > 0);

    ziputils.makeOneFileZip('./', 'root', data)
      .then( buf => {
        let s = Object.prototype.toString.call(buf);
        //console.log(`typeof buffer: ${s}\n`);
        fs.writeFileSync('./test.zip', buf);
        done();
      });
  });

  it('ZIP whole directory', function(done) {
    ziputils.zipDirectory('./test/fixtures', function(err, result) {
      assert(!err);
      assert(result.length > 0);
      fs.writeFileSync('./testdir.zip', result);
      done();
    });
  }, LONG_TIMEOUT);

  it('Enumerate node file list', function(done) {
    ziputils.enumerateDirectory('./test/fixtures/employeesnode', 'node', false, function(err, files) {
      if (err) { return done(err); }

      //console.log('%j', files);

      // Should contain README.md
      let readme = files.find(function(f) {
        return (f.fileName === 'test/fixtures/employeesnode/README.md');
      });
      assert(readme);
      assert.equal(readme.fileName, 'test/fixtures/employeesnode/README.md');
      assert.equal(readme.resourceName, 'README.md');
      assert.equal(readme.resourceType, 'node');
      assert(!readme.directory);

      // Should not contain an entry for the toplevel "node_modules" directory
      let topModules = files.find(function(f) {
        return (f.fileName === 'test/fixtures/employeesnode/node_modules');
      });
      assert(!topModules);

      // Should contain "node_modules/express"
      var express = files.find(function(f) {
        return (f.fileName === 'test/fixtures/employeesnode/node_modules/express');
      });
      assert(express);
      assert.equal(express.fileName, 'test/fixtures/employeesnode/node_modules/express');
      assert.equal(express.resourceName, 'node_modules_express.zip');
      assert(express.directory);

      done();
    });
  });

  it('Enumerate regular file list', function() {
    var files =
      ziputils.enumerateResourceDirectory('./test/fixtures/employees/apiproxy/resources');

    assert.equal(files.length, 7);
    assert(files.find( f => f.fileName.endsWith("hello.js") && f.resourceType == "jsc"));
    assert(files.find( f => f.fileName.endsWith("config.js")));
    assert(files.find( f => f.fileName.endsWith("package.json")));
    assert(files.find( f => f.fileName.endsWith("node_modules.zip")));
    //console.log('%j', files);
  });

  it('unzipProxy rejects zip entries attempting Zip Slip path traversal', function(done) {
    const deploycommon = require('../lib/deploycommon');
    const tmp = require('tmp');
    const path = require('path');
    const jszip = require('jszip');

    tmp.dir(function(err, tempDir) {
      assert(!err);
      let maliciousZip = new jszip();
      maliciousZip.file('../evil.txt', 'malicious payload');
      maliciousZip.generateAsync({ type: 'nodebuffer' }).then(function(buf) {
        let zipPath = path.join(tempDir, 'malicious.zip');
        let extractDir = path.join(tempDir, 'extract');
        fs.mkdirSync(extractDir);
        fs.writeFileSync(zipPath, buf);

        deploycommon.unzipProxy({ file: zipPath }, extractDir, '', function(err) {
          assert(err, 'Expected error when extracting malicious zip');
          assert(err.message.indexOf('Security error') !== -1, 'Expected security error message');
          assert(!fs.existsSync(path.join(tempDir, 'evil.txt')), 'Malicious file must not be created');
          done();
        });
      });
    });
  });
});
