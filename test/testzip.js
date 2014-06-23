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
});
