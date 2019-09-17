var assert = require('assert');
var util = require('util');

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
      bar: { required: false, prompt: false },
      baz: { required: true, prompt: true }
    };
    var opts = { foo: 1, bar: 'value'};
    options.validate(opts, desc, function(err) {
      assert(err);
      assert(/Missing required option/.test(err.message));
      done();
    });
  });

  it('Test missing option prompt false', function(done) {
    var desc = {
      foo: {},
      ping: { required: false, prompt: false },
      pong: { required: true, prompt: false }
    };
    var opts = { foo: 1, ping: 1};
    options.validate(opts, desc, function(err) {
      assert(err);
      assert(/Missing required option/.test(err.message));
      done();
    });
  });
  it('Test nothing and missing stuff', function(done) {
    var desc = {
      foo: {},
      bar: { required: false, prompt: false },
      baz: { required: true, prompt: true }
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
      foo: { },
      ping: { name: 'Ping', required: false, prompt: false },
      pong: { name: 'Pong', required: true, prompt: false }
    };
    var opts = { ping: 1, pong: 'value'};
    var help = options.getHelp(desc);
    // console.log('Help is: ' + help);
    assert.notEqual( help, undefined );
  });

  it('Test command-line toggle', function() {
    var desc = {
      foo: {},
      toggle: { shortOption: 't', toggle: true }
    };
    var argv = [ '--foo', 'bar', '--toggle' ];
    var opts = options.getopts(argv, 0, desc);
    assert.equal(opts.foo, 'bar');
    assert.equal(opts.toggle, true);
  });
  it('Test secure value', function() {
    var sv = new options.SecureValue('foobar');
    assert.notEqual(util.format('%s', sv), 'foobar');
    assert.notDeepEqual(util.format('%s', sv), 'foobar');
    assert.equal(sv.getValue(), 'foobar');
    assert(sv instanceof options.SecureValue);
  });
});
