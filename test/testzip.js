var assert = require('assert');
var fs = require('fs');
var _ = require('underscore');

var ziputils = require('../lib/ziputils');

describe('ZIP Utilities Test', function() {
  it('Create one file archive', function() {
    var data = 'Hello, World!';
    var buf = ziputils.makeOneFileZip('./', 'root', data);
    assert(data.length > 0);
    fs.writeFileSync('./test.zip', buf);
  });

  it('ZIP whole directory', function(done) {
    this.timeout(60000);
    ziputils.zipDirectory('./test/fixtures', function(err, result) {
      assert(!err);
      assert(result.length > 0);
      fs.writeFileSync('./testdir.zip', result);
      done();
    });
  });

  it('Enumerate node file list', function() {
    var files = ziputils.enumerateNodeDirectory('./test/fixtures/employeesnode');
    //console.log('%j', files);

    // Should contain README.md
    var readme = _.find(files, function(f) {
      return (f.fileName === 'test/fixtures/employeesnode/README.md');
    });
    assert(readme);
    assert.equal(readme.fileName, 'test/fixtures/employeesnode/README.md');
    assert.equal(readme.resourceName, 'README.md');
    assert.equal(readme.resourceType, 'node');
    assert(!readme.directory);

    // Should not contain "node_modules.zip"
    var topModules = _.find(files, function(f) {
      return (f.fileName === 'test/fixtures/employeesnode/node_modules');
    });
    assert(!topModules);

    // Should contain "node_modules_express"
    var express = _.find(files, function(f) {
      return (f.fileName === 'test/fixtures/employeesnode/node_modules/express');
    });
    assert(express);
    assert.equal(express.fileName, 'test/fixtures/employeesnode/node_modules/express');
    assert.equal(express.resourceName, 'node_modules_express.zip');
    assert(express.directory);
  });

  it('Enumerate regular file list', function() {
    var files =
      ziputils.enumerateResourceDirectory('./test/fixtures/employees/apiproxy/resources');
    console.log('%j', files);
  });
});
