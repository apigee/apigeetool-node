var assert = require('assert');

var options = require('../lib/options');

describe('Options parsing test', function(done) {
  it('Test no descriptor', function(done) {
    var desc = {};
    var opts = { foo: 1, bar: 'baz'};
    options.validate(opts, desc, function(err) {
      assert(!err);
      done();
    });
  });

  it('Test nothing wrong', function(done) {
    var desc = {
      foo: {},
      bar: { required:false }
    };
    var opts = { foo: 1, bar: 'baz'};
    options.validate(opts, desc, function(err) {
      assert(!err);
      done();
    });
  });

  it('Test missing option', function(done) {
    var desc = {
      foo: {},
      bar: { required: false },
      baz: { required: true }
    };
    var opts = { foo: 1, bar: 'baz'};
    options.validate(opts, desc, function(err) {
      assert(err);
      assert(/Missing required option/.test(err.message));
      done();
    });
  });
  it('Test nothing and missing stuff', function(done) {
    var desc = {
      foo: {},
      bar: { required: false },
      baz: { required: true }
    };
    options.validate({}, desc, function(err) {
      assert(err);
      assert(/Missing required option/.test(err.message));
      done();
    });
  });

  it('Test command-line nothing', function() {
    var desc = {
      foo: {},
      bar: { required: false },
      baz: { required: true }
    };
    var argv = [ 'node', 'foo' ];
    var opts = options.getopts(argv, 2, desc);
  });


  it('Test command-line happy path', function() {
    var desc = {
      foo: {},
      bar: { required: false },
      baz: { required: true }
    };
    var argv = [ 'node', 'foo', '--foo', 'bar', '--bar', 'baz' ];
    var opts = options.getopts(argv, 2, desc);
    assert.equal(opts.foo, 'bar');
    assert.equal(opts.bar, 'baz');
  });

  it('Test command-line short happy path', function() {
    var desc = {
      foo: { shortOption: 'f' },
      bar: { required: false, shortOption: 'b' },
      baz: { required: true }
    };
    var argv = [ 'node', 'foo', '-f', 'bar', '-b', 'baz', '--baz', 'biz' ];
    var opts = options.getopts(argv, 2, desc);
    assert.equal(opts.foo, 'bar');
    assert.equal(opts.bar, 'baz');
    assert.equal(opts.baz, 'biz');
  });

  it('Test command-line unknown', function() {
    var desc = {
      foo: {},
      bar: { required: false },
      baz: { required: true }
    };
    var argv = [ 'node', 'foo', '--foo', 'bar', '--biz', 'baz' ];
    assert.throws(function() {
      options.getopts(argv, 2, desc);
    });
  });

  it('Test command-line help', function() {
    var desc = {
      foo: {},
      bar: { required: false, shortOption: 'b' },
      baz: { required: true }
    };
    var help = options.getHelp(desc);
    //console.log('Help is:' + help);
  });
});
