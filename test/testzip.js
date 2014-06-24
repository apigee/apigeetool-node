var assert = require('assert');
var fs = require('fs');

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
});
