'use strict';

var apigeetool = require('..');
var assert = require('assert');
var path = require('path');
var request = require('request');
var util = require('util');
var stream = require('stream');
var _ = require('underscore');

var config = require('./testconfig');

var REASONABLE_TIMEOUT = 120000;
var APIGEE_PROXY_NAME = 'apigee-cli-apigee-test';
var NODE_PROXY_NAME = 'apigee-cli-node-test';
var HOSTED_TARGETS_PROXY_NAME = 'cli-hosted-targets-test';
var CACHE_RESOURCE_NAME='apigee-cli-remotetests-cache1';
var PROXY_BASE_PATH = '/apigee-cli-test-employees';
var APIGEE_PRODUCT_NAME = 'TESTPRODUCT';
var APIGEE_PRIVATE_PRODUCT_NAME = 'TESTPRODUCT-private';
var DEVELOPER_EMAIL = 'test123@apigee.com';
var APP_NAME = 'test123test123';
var TARGET_SERVER_NAME = 'apigee-cli-test-servername';
var MAP_NAME = 'apigee-cli-test-kvm';
var MAP_NAME_ENCRYPTED = 'apigee-cli-test-kvm-encrypted';
var SHARED_FLOW_NAME = 'apigee-cli-sf';
var ROLE_NAME = 'apigee-cli-test-role';
var verbose = false;
var deployedRevision;
var deployedUri;
var prevSharedFlow;

// Run all using: mocha remotetests
// Run all "describe" tests using: mocha remotetests --grep "SharedFlows and FlowHooks"
// Run one "it" test using: mocha remotetests --grep "fetchSharedFlow"
// To see tests use 'grep "  it" remotetest.j'

describe('Remote Tests', function() { //  it
  this.timeout(REASONABLE_TIMEOUT);

  it('Deploy Apigee Proxy', function(done) {
    var opts = baseOpts();
    opts.api = APIGEE_PROXY_NAME;
    opts.directory = path.join(__dirname, '../test/fixtures/employees');

    var sdk = apigeetool.getPromiseSDK()

    sdk.deployProxy(opts)
      .then(function(result){
        try {
          if(Array.isArray(result)) {
            result = result[0]
          }
          assert.equal(result.name, APIGEE_PROXY_NAME);
          assert.equal(result.environment, config.environment);
          assert.equal(result.state, 'deployed');
          assert.equal(result.uris.length, 1);
          assert(typeof result.revision === 'number');
          deployedRevision = result.revision;
          deployedUri = result.uris[0];
          done();
        } catch (e) {
          done(e);
        }
      },function(err){
        done(err);
      })
  });
  
  it('Create Product', function(done){
    var opts = baseOpts() ;
    var displayName = 'custom name';
    opts.productName = APIGEE_PRODUCT_NAME;
    opts.productDesc = 'abc123';
    opts.displayName = displayName;
    opts.proxies = APIGEE_PROXY_NAME;
    opts.quota = '1';
    opts.quotaInterval = '1';
    opts.quotaTimeUnit = 'minute';
    opts.approvalType = "auto";

    var sdk = apigeetool.getPromiseSDK()

    sdk.createProduct(opts)
      .then(function(result){
        try {
          assert.equal(result.displayName, displayName);
          done();
        } catch (e) {
          done(e);
        }
      },function(err){
        done(err)
      }) ;
  });

  it('Create Private Product', function(done){
    var opts = baseOpts() ;
    var displayName = 'custom name';
    opts.productName = APIGEE_PRIVATE_PRODUCT_NAME;
    opts.productDesc = 'abc123';
    opts.displayName = displayName;
    opts.proxies = APIGEE_PROXY_NAME;
    opts.quota = '1';
    opts.quotaInterval = '1';
    opts.quotaTimeUnit = 'minute';
    opts.attributes = [ {"name": "access", "value": "private"} ];
    opts.approvalType = "auto";

    var sdk = apigeetool.getPromiseSDK()

    sdk.createProduct(opts)
      .then(function(result){
        try {
          assert.equal(result.displayName, displayName);
          assert.equal(result.attributes.length, 1);
          assert.equal(result.attributes[0].name, 'access');
          assert.equal(result.attributes[0].value, 'private');
          done();
        } catch (e) {
          done(e);
        }
      },function(err){
        done(err)
      }) ;
  });

  it('Create Developer' , function(done){
    var opts = baseOpts()
    opts.email = DEVELOPER_EMAIL
    opts.firstName = 'Test'
    opts.lastName = 'Test1'
    opts.userName = 'runningFromTest123'

    var sdk = apigeetool.getPromiseSDK()

    sdk.createDeveloper(opts)
      .then(function(result){
        done()
      },function(err){
        done(err)
      }) ;
  });

  it('Create App' , function(done){
    var opts = baseOpts()
    opts.name = APP_NAME
    opts.apiProducts = APIGEE_PRODUCT_NAME
    opts.email = DEVELOPER_EMAIL

    var sdk = apigeetool.getPromiseSDK()

    sdk.createApp(opts)
      .then(function(result){
        done()
      },function(err){
        done(err)
      });
  });

  it('Delete App' , function(done){
    var opts = baseOpts()
    opts.email = DEVELOPER_EMAIL
    opts.name = APP_NAME
    var sdk = apigeetool.getPromiseSDK()
    sdk.deleteApp(opts)
      .then(function(result){
        done()
      },function(err){
        done(err)
      }) ;
  });

  it('Delete Developer' , function(done){
    var opts = baseOpts()
    opts.email = DEVELOPER_EMAIL
    var sdk = apigeetool.getPromiseSDK()
    sdk.deleteDeveloper(opts)
      .then(function(result){
        done()
      },function(err){
        done(err)
      }) ;
  });

  it('Delete API Product',function(done){
    var opts = baseOpts() ;
    opts.productName = APIGEE_PRODUCT_NAME

    var sdk = apigeetool.getPromiseSDK()

    sdk.deleteProduct(opts)
      .then(function(result){
        done()
      },function(err){
        done(err)
      }) ;
  });

  it('Delete API private Product',function(done){
    var opts = baseOpts() ;
    opts.productName = APIGEE_PRIVATE_PRODUCT_NAME 

    var sdk = apigeetool.getPromiseSDK()

    sdk.deleteProduct(opts)
      .then(function(result){
        done()
      },function(err){
        done(err)
      }) ;
  });

  it('Deploy Apigee Proxy', function(done) {
    var opts = baseOpts();
    opts.api = APIGEE_PROXY_NAME;
    opts.directory = path.join(__dirname, '../test/fixtures/employees');
    apigeetool.deployProxy(opts, function(err, result) {
      if (verbose) {
        console.log('Deploy result = %j', result);
      }
      if (err) {
        done(err);
      } else {
        try {
          if(Array.isArray(result)) {
            result = result[0]
          }
          assert.equal(result.name, APIGEE_PROXY_NAME);
          assert.equal(result.environment, config.environment);
          assert.equal(result.state, 'deployed');
          assert.equal(result.uris.length, 1);
          assert(typeof result.revision === 'number');
          deployedRevision = result.revision;
          deployedUri = result.uris[0];
          done();
        } catch (e) {
          done(e);
        }
      }
    });
  });

  it('Verify deployed URI', function(done) {
    if (verbose) {
      console.log('Testing %s', deployedUri);
    }
    request(deployedUri, function(err, resp) {
      if (err) {
        done(err);
      } else {
        try {
          assert.equal(resp.statusCode, 200);
          done();
        } catch (e) {
          done(e);
        }
      }
    });
  });

  it('List Deployments by app', function(done) {
    var opts = baseOpts();
    delete opts.environment;
    opts.api = APIGEE_PROXY_NAME;
    opts.long = true;

    apigeetool.listDeployments(opts, function(err, result) {
      if (verbose) {
        console.log('List result = %j', result);
      }
      if (err) {
        done(err);
      } else {
        var deployment = _.find(result.deployments, function(d) {
          return (d.name === APIGEE_PROXY_NAME);
        });
        try {
          assert.equal(deployment.name, APIGEE_PROXY_NAME);
          assert.equal(deployment.environment, config.environment);
          assert.equal(deployment.state, 'deployed');
          assert.equal(deployment.revision, deployedRevision);
          assert.equal(deployment.uris.length, 1);
          assert.equal(deployment.uris[0], deployedUri);
          done();
        } catch (e) {
          done(e);
        }
      }
    });
  });

  it('List Deployments by environment', function(done) {
    var opts = baseOpts();

    apigeetool.listDeployments(opts, function(err, result) {
      if (verbose) {
        console.log('List result = %j', result);
      }
      if (err) {
        done(err);
      } else {
        var deployment = _.find(result.deployments, function(d) {
          return (d.name === APIGEE_PROXY_NAME);
        });
        try {
          assert.equal(deployment.name, APIGEE_PROXY_NAME);
          assert.equal(deployment.environment, config.environment);
          assert.equal(deployment.state, 'deployed');
          assert.equal(deployment.revision, deployedRevision);
          done();
        } catch (e) {
          done(e);
        }
      }
    });
  });

  it('Undeploy Apigee Proxy With Revision', function(done) {
    var opts = baseOpts();
    opts.api = APIGEE_PROXY_NAME;
    opts.revision = deployedRevision;

    apigeetool.undeploy(opts, function(err, result) {
      if (verbose) {
        console.log('Undeploy result = %j', result);
      }
      if (err) {
        done(err);
      } else {
        try {
          assert.equal(result.name, APIGEE_PROXY_NAME);
          assert.equal(result.environment, config.environment);
          assert.equal(result.state, 'undeployed');
          done();
        } catch (e) {
          done(e);
        }
      }
    });
  });

  it('Deploy Apigee Proxy with base path', function(done) {
    var opts = baseOpts();
    opts.api = APIGEE_PROXY_NAME;
    opts.directory = path.join(__dirname, '../test/fixtures/employees');
    opts['base-path'] = PROXY_BASE_PATH;

    apigeetool.deployProxy(opts, function(err, result) {
      if (verbose) {
        console.log('Deploy result = %j', result);
      }
      if (err) {
        done(err);
      } else {
        try {
          if(Array.isArray(result)) result = result[0]
          assert.equal(result.name, APIGEE_PROXY_NAME);
          assert.equal(result.environment, config.environment);
          assert.equal(result.state, 'deployed');
          assert.equal(result.uris.length, 1);
          assert(typeof result.revision === 'number');
          deployedRevision = result.revision;
          deployedUri = result.uris[0];
          done();
        } catch (e) {
          done(e);
        }
      }
    });
  });

  it('Verify deployed URI', function(done) {
    if (verbose) {
      console.log('Testing %s', deployedUri);
    }
    request(deployedUri, function(err, resp) {
      if (err) {
        done(err);
      } else {
        try {
          assert.equal(resp.statusCode, 200);
          done();
        } catch (e) {
          done(e);
        }
      }
    });
  });

  it('Deploy Apigee Proxy with base path and run NPM remotely', function(done) {
    var opts = baseOpts();
    opts.api = APIGEE_PROXY_NAME;
    opts.directory = path.join(__dirname, '../test/fixtures/employees');
    opts['resolve-modules'] = true;
    opts['base-path'] = PROXY_BASE_PATH;

    apigeetool.deployProxy(opts, function(err, result) {
      if (verbose) {
        console.log('Deploy result = %j', result);
      }
      if (err) {
        done(err);
      } else {
        try {
          if(Array.isArray(result)) result = result[0]
          assert.equal(result.name, APIGEE_PROXY_NAME);
          assert.equal(result.environment, config.environment);
          assert.equal(result.state, 'deployed');
          assert.equal(result.uris.length, 1);
          assert(typeof result.revision === 'number');
          deployedRevision = result.revision;
          deployedUri = result.uris[0];
          done();
        } catch (e) {
          done(e);
        }
      }
    });
  });

  it('Verify deployed URI', function(done) {
    if (verbose) {
      console.log('Testing %s', deployedUri);
    }
    request(deployedUri, function(err, resp) {
      if (err) {
        done(err);
      } else {
        try {
          assert.equal(resp.statusCode, 200);
          done();
        } catch (e) {
          done(e);
        }
      }
    });
  });

  it('Undeploy Apigee Proxy With Revision', function(done) {
    var opts = baseOpts();
    opts.api = APIGEE_PROXY_NAME;
    opts.revision = deployedRevision;

    apigeetool.undeploy(opts, function(err, result) {
      if (verbose) {
        console.log('Undeploy result = %j', result);
      }
      if (err) {
        done(err);
      } else {
        try {
          assert.equal(result.name, APIGEE_PROXY_NAME);
          assert.equal(result.environment, config.environment);
          assert.equal(result.state, 'undeployed');
          done();
        } catch (e) {
          done(e);
        }
      }
    });
  });

  it('Fetch proxy', function(done) {
    var opts = baseOpts();
    opts.api = APIGEE_PROXY_NAME;
    opts.revision = deployedRevision;

    apigeetool.fetchProxy(opts, function(err, result) {
      if (verbose) {
        console.log('Fetch proxy result = %j', result);
      }
      if (err) { done(err); } else { done(); }
    });
  });

  it('Delete proxy', function(done) {
    var opts = baseOpts();
    opts.api = APIGEE_PROXY_NAME;

    apigeetool.delete(opts, function(err, result) {
      if (verbose) {
        console.log('Delete proxy result = %j', result);
      }
      if (err) { done(err); } else { done(); }
    });
  });

});

describe('Node.js Apps', function() { //  it
  this.timeout(REASONABLE_TIMEOUT);

  it('Deploy Node.js App', function(done) {
    var opts = baseOpts();
    opts.api = NODE_PROXY_NAME;
    opts.directory = path.join(__dirname, '../test/fixtures/employeesnode');
    opts.main = 'server.js';
    opts['base-path'] = '/apigee-cli-node-test';

    apigeetool.deployNodeApp(opts, function(err, result) {
      if (verbose) {
        console.log('Deploy result = %j', result);
      }
      if (err) {
        done(err);
      } else {
        try {
          if(Array.isArray(result)) result = result[0]
          assert.equal(result.name, NODE_PROXY_NAME);
          assert.equal(result.environment, config.environment);
          assert.equal(result.state, 'deployed');
          //it will be 2 for remote testing public cloud/ http & https
          assert.equal(result.uris.length, 2);
          assert(typeof result.revision === 'number');
          deployedRevision = result.revision;
          deployedUri = result.uris[0];
          done();
        } catch (e) {
          done(e);
        }
      }
    });
  });

  it('Verify deployed URI', function(done) {
    if (verbose) {
      console.log('Testing %s', deployedUri);
    }
    request(deployedUri, function(err, resp) {
      if (err) {
        done(err);
      } else {
        try {
          assert.equal(resp.statusCode, 200);
          done();
        } catch (e) {
          done(e);
        }
      }
    });
  });

  it('Check logs from deployed URI', function(done) {
    var opts = baseOpts();
    opts.api = NODE_PROXY_NAME;

    var logStream = new stream.PassThrough();
    logStream.setEncoding('utf8');
    opts.stream = logStream;

    apigeetool.getLogs(opts, function(err) {
      assert(!err);

      var allLogs = '';
      logStream.on('data', function(chunk) {
        allLogs += chunk;
      });
      logStream.on('end', function() {
        try {
          assert(/Listening on port/.test(allLogs));
          done();
        } catch (e) {
          done(e);
        }
      });
    });
  });

  it('Deploy Node.js App and run NPM remotely', function(done) {
    var opts = baseOpts();
    opts.api = NODE_PROXY_NAME;
    opts.directory = path.join(__dirname, '../test/fixtures/employeesnode');
    opts.main = 'server.js';
    opts['resolve-modules'] = true;
    opts['base-path'] = '/apigee-cli-node-test';

    apigeetool.deployNodeApp(opts, function(err, result) {
      if (verbose) {
        console.log('Deploy result = %j', result);
      }
      if (err) {
        done(err);
      } else {
        try {
          if(Array.isArray(result)) result=result[0]
          assert.equal(result.name, NODE_PROXY_NAME);
          assert.equal(result.environment, config.environment);
          assert.equal(result.state, 'deployed');
          assert.equal(result.uris.length, 2);
          assert(typeof result.revision === 'number');
          deployedRevision = result.revision;
          deployedUri = result.uris[0];
          done();
        } catch (e) {
          done(e);
        }
      }
    });
  });

  it('Verify deployed URI', function(done) {
    if (verbose) {
      console.log('Testing %s', deployedUri);
    }
    request(deployedUri, function(err, resp) {
      if (err) {
        done(err);
      } else {
        try {
          assert.equal(resp.statusCode, 200);
          done();
        } catch (e) {
          done(e);
        }
      }
    });
  });

  it('List Deployments by app', function(done) {
    var opts = baseOpts();
    delete opts.environment;
    opts.api = NODE_PROXY_NAME;
    opts.long = true;

    apigeetool.listDeployments(opts, function(err, result) {
      if (verbose) {
        console.log('List result = %j', result);
      }
      if (err) {
        done(err);
      } else {
        var deployment = _.find(result.deployments, function(d) {
          return (d.name === NODE_PROXY_NAME);
        });
        try {
          assert.equal(deployment.name, NODE_PROXY_NAME);
          assert.equal(deployment.environment, config.environment);
          assert.equal(deployment.state, 'deployed');
          assert.equal(deployment.revision, deployedRevision);
          assert.equal(deployment.uris.length, 2);
          assert.equal(deployment.uris[0], deployedUri);
          done();
        } catch (e) {
          done(e);
        }
      }
    });
  });

  it('Undeploy Node.js App Without Revision', function(done) {
    var opts = baseOpts();
    opts.api = NODE_PROXY_NAME;

    apigeetool.undeploy(opts, function(err, result) {
      if (verbose) {
        console.log('Undeploy result = %j', result);
      }
      if (err) {
        done(err);
      } else {
        try {
          assert.equal(result.name, NODE_PROXY_NAME);
          assert.equal(result.environment, config.environment);
          assert.equal(result.state, 'undeployed');
          assert.equal(result.revision, deployedRevision);
          done();
        } catch (e) {
          done(e);
        }
      }
    });
  });

  it('Delete node proxy', function(done) {
    var opts = baseOpts();
    opts.api = NODE_PROXY_NAME;

    apigeetool.delete(opts, function(err, result) {
      if (verbose) {
        console.log('Delete node proxy result = %j', result);
      }
      if (err) { done(err); } else { done(); }
    });
  });

}); // End Node.js Apps

describe('Hosted Target', function() { //  it
  this.timeout(REASONABLE_TIMEOUT);

  it('Deploy Hosted Targets App', function(done) {
    var opts = baseOpts();
    opts.api = HOSTED_TARGETS_PROXY_NAME;
    opts.directory = path.join(__dirname, '../test/fixtures/hellohostedtargets');
    opts.main = 'server.js';
    opts['base-path'] = '/cli-hosted-targets-test';

    apigeetool.deployHostedTarget(opts, function(err, result) {
      if (verbose) {
        console.log('Deploy result = %j', result);
      }
      if (err) {
        done(err);
      } else {
        try {
          if(Array.isArray(result)) result = result[0]
          assert.equal(result.name, HOSTED_TARGETS_PROXY_NAME);
          assert.equal(result.environment, config.environment);
          assert.equal(result.state, 'deployed');
          //it will be 2 for remote testing public cloud/ http & https
          assert.equal(result.uris.length, 2);
          assert(typeof result.revision === 'number');
          deployedRevision = result.revision;
          deployedUri = result.uris[0];
          setTimeout(done, 10000);
        } catch (e) {
          done(e);
        }
      }
    });
  });

  it('List Deployments by app', function(done) {
    var opts = baseOpts();
    delete opts.environment;
    opts.api = HOSTED_TARGETS_PROXY_NAME;
    opts.long = true;

    apigeetool.listDeployments(opts, function(err, result) {
      if (verbose) {
        console.log('List result = %j', result);
      }
      if (err) {
        done(err);
      } else {
        var deployment = _.find(result.deployments, function(d) {
          return (d.name === HOSTED_TARGETS_PROXY_NAME);
        });
        try {
          assert.equal(deployment.name, HOSTED_TARGETS_PROXY_NAME);
          assert.equal(deployment.environment, config.environment);
          assert.equal(deployment.state, 'deployed');
          assert.equal(deployment.revision, deployedRevision);
          assert.equal(deployment.uris.length, 2);
          assert.equal(deployment.uris[0], deployedUri);
          done();
        } catch (e) {
          done(e);
        }
      }
    });
  });

  it('Verify deployed URI', function(done) {
    if (verbose) {
      console.log('Testing %s', deployedUri);
    }
    request(deployedUri, function(err, resp, body) {
      if (err) {
        console.error(err, resp.statusCode, body);
        done(err);
      } else {
        try {
          assert.equal(resp.statusCode, 200);
          done();
        } catch (e) {
          done(e);
        }
      }
    });
  });

  it('Check build logs from deployed URI', function(done) {
    var opts = baseOpts();
    opts['hosted-build'] = true;
    opts.api = HOSTED_TARGETS_PROXY_NAME;

    var logStream = new stream.PassThrough();
    logStream.setEncoding('utf8');
    opts.stream = logStream;
    apigeetool.getLogs(opts, function(err) {
      assert.ifError(err);

      var allLogs = '';
      logStream.on('data', function(chunk) {
        allLogs += chunk;
      });
      logStream.on('end', function() {
        assert(/DONE/.test(allLogs));
        done();
      });
    });
  });

  it('Check runtime logs from deployed URI', function(done) {
    var opts = baseOpts();
    opts['hosted-runtime'] = true;
    opts.api = HOSTED_TARGETS_PROXY_NAME;

    var logStream = new stream.PassThrough();
    logStream.setEncoding('utf8');
    opts.stream = logStream;

    apigeetool.getLogs(opts, function(err) {
      assert.ifError(err);

      var allLogs = '';
      logStream.on('data', function(chunk) {
        allLogs += chunk;
      });
      logStream.on('end', function() {
        //Validate runtime logs
        assert(/Node HTTP server is listening/.test(allLogs));
        done();
      });
    });
  });

  it('Undeploy Hosted Targets App Without Revision', function(done) {
    var opts = baseOpts();
    opts.api = HOSTED_TARGETS_PROXY_NAME;

    apigeetool.undeploy(opts, function(err, result) {
      if (verbose) {
        console.log('Undeploy result = %j', result);
      }
      if (err) {
        done(err);
      } else {
        try {
          assert.equal(result.name, HOSTED_TARGETS_PROXY_NAME);
          assert.equal(result.environment, config.environment);
          assert.equal(result.state, 'undeployed');
          assert.equal(result.revision, deployedRevision);
          done();
        } catch (e) {
          done(e);
        }
      }
    });
  });

  it('Delete hosted target proxy', function(done) {
    var opts = baseOpts();
    opts.api = HOSTED_TARGETS_PROXY_NAME;

    apigeetool.delete(opts, function(err, result) {
      if (verbose) {
        console.log('Delete hosted target proxy result = %j', result);
      }
      if (err) { done(err); } else { done(); }
    });
  });

}); // end hosted target tests

describe('Caches', function() { //  it
  it('Create an Cache Resource',function(done){
    var opts = baseOpts();
    opts.cache = CACHE_RESOURCE_NAME;
    apigeetool.createcache(opts,function(err,result) {
      if (verbose) {
        console.log('Create Cache result = %j', result);
      }
      if (err) {
        done(err);
      } else {
        done()
      }
    });
  });

  it('Delete Cache Resource',function(done){
    var opts = baseOpts();
    opts.cache = CACHE_RESOURCE_NAME;
    apigeetool.deletecache(opts,function(err,result) {
      if (verbose) {
        console.log('Delete Cache result = %j', result);
      }
      if (err) {
        done(err);
      } else {
        done()
      }
    });
  });
}); // end cache tests

describe('Target Servers', function() { //  it
  this.timeout(REASONABLE_TIMEOUT);

  it('Create Target Server',function(done){
    var opts = baseOpts();
    opts.environment = config.environment;
    opts.targetServerName = TARGET_SERVER_NAME;
    opts.targetHost = 'localhost';
    opts.targetEnabled = true;
    opts.targetPort = 443;
    opts.targetSSL=true;
    opts.environment = config.environment

    apigeetool.createTargetServer(opts, function(err, result) {
      if (verbose) {
        console.log('Create Target Server result = %j', result);
      }
      if (err) {
        done(err);
      } else {
        try {
          assert.equal(result.name,TARGET_SERVER_NAME);
          assert.equal(result.port,443);
          assert.equal(result.isEnabled,true);
          done();
        } catch (e) {
          done(e);
        }
      }
    });
  });

  it('List Target Servers',function(done){
    var opts = baseOpts();
    opts.environment = config.environment;
    apigeetool.listTargetServers(opts, function(err, result) {
      if (verbose) {
        console.log('List Target Servers result = %j', result);
      }
      if (err) {
        done(err);
      } else {
        try {
          assert.equal(result.includes(TARGET_SERVER_NAME),true);
          done();
        } catch (e) {
          done(e);
        }
      }
    });
  });

  it('Get Target Server',function(done){
    var opts = baseOpts();
    opts.environment = config.environment;
    opts.targetServerName = TARGET_SERVER_NAME;
    apigeetool.getTargetServer(opts, function(err, result) {
      if (verbose) {
        console.log('Get Target Server result = %j', result);
      }
      if (err) {
        done(err);
      } else {
        try {
          assert.equal(result.name,TARGET_SERVER_NAME);
          assert.equal(result.port,443);
          assert.equal(result.isEnabled,true);
          done();
        } catch (e) {
          done(e);
        }
      }
    });
  });

  it('Delete Target Server',function(done){
    var opts = baseOpts();
    opts.environment = config.environment;
    opts.targetServerName = TARGET_SERVER_NAME;
    apigeetool.deleteTargetServer(opts, function(err, result) {
      if (verbose) {
        console.log('Delete Target Server result = %j', result);
      }
      if (err) {
        done(err);
      } else {
        try {
          assert.equal(result.name,TARGET_SERVER_NAME);
          done();
        } catch (e) {
          done(e);
        }
      }
    });
  });

}); // end target server tests

describe('KVM', function() { //  it
  it('Create KVM',function(done){
    var opts = baseOpts();
    opts.mapName = MAP_NAME;
    opts.environment = config.environment;
    apigeetool.getPromiseSDK()
      .createKVM(opts)
      .then(function(res){
        if (verbose) {
          console.log('Create KVM result = %j', res);
        }
        done()
      },function(err){
        console.log(err)
        done(err)
      })
  });

  it('Create Encrypted KVM',function(done){
    var opts = baseOpts();
    opts.mapName = MAP_NAME_ENCRYPTED;
    opts.environment = config.environment;
    opts.encrypted = true;
    apigeetool.getPromiseSDK()
      .createKVM(opts)
      .then(function(res){
        if (!res.encrypted) {
          return done(new Error('Map was not encrypted'));
        } else if (verbose) {
          console.log('Create KVM result = %j', res);
        }
        done();
      }, function(err){
        console.log(err)
        done(err)
      })
  });

  it('Delete Encrypted KVM',function(done){
    var opts = baseOpts();
    opts.mapName = MAP_NAME_ENCRYPTED;
    opts.environment = config.environment;
    apigeetool.deleteKVM(opts,function(err,result) {
      if (verbose) {
        console.log('Delete Encrypted KVM result = %j', result);
      }
      if (err) {
        done(err);
      } else {
        done()
      }
    });
  });

  it('Add Entry to KVM',function(done){
    // This will not work for non-cps orgs
    var opts = baseOpts();
    opts.mapName = MAP_NAME;
    opts.environment = config.environment;
    opts.entryName = 'test';
    opts.entryValue = 'test1';
    apigeetool.getPromiseSDK()
      .addEntryToKVM(opts)
      .then(function(res){
        if (verbose) {
          console.log('Add Entry to KVM result = %j', res);
        }
        done()
      },function(err){
        console.log(err)
        done(err)
      })
  });

  it('Get KVM Entry', function(done) {
    var opts = baseOpts();
    opts.mapName = MAP_NAME;
    opts.environment = config.environment;
    opts.entryName = 'test';
    apigeetool.getPromiseSDK()
      .getKVMentry(opts)
      .then(function(body){
        if (verbose) {
          console.log('Get KVM Entry result = %j', body);
        }
        assert.equal(body.value, 'test1')
        done()
      },
      function(err) {
        console.log(err);
        done(err);
      })
  });

  it('Get KVM Map', function(done) {
    var opts = baseOpts();
    opts.mapName = MAP_NAME;
    opts.environment = config.environment;
    apigeetool.getPromiseSDK()
      .getKVMmap(opts)
      .then(function(body){
        if (verbose) {
          console.log('Get KVM Map result = %j', body);
        }
        assert.equal(body.entry.length, 1)
        done()
      },
      function(err) {
        console.log(err);
        done(err);
      })
  });

  it('Delete KVM Entry', function(done) {
    var opts = baseOpts();
    opts.mapName = MAP_NAME;
    opts.environment = config.environment;
    opts.entryName = 'test';
    apigeetool.getPromiseSDK()
      .deleteKVMentry(opts)
      .then(function(body){
        if (verbose) {
          console.log('Get KVM Map result = %j', body);
        }
        assert.equal(body.value, 'test1')
        done()
      },
      function(err) {
        console.log(err);
        done(err);
      })
  });

  it('Delete KVM',function(done){
    var opts = baseOpts();
    opts.mapName = MAP_NAME;
    opts.environment = config.environment;
    apigeetool.deleteKVM(opts,function(err,result) {
      if (verbose) {
        console.log('Delete KVM result = %j', result);
      }
      if (err) {
        done(err);
      } else {
        done()
      }
    });
  });
}); // end KVM tests

describe('SharedFlows and FlowHooks', function() { //  it
  this.timeout(REASONABLE_TIMEOUT);
  it('Deploy SharedFlow', function (done) {
    var opts = baseOpts();
    var deployedRevision;
    opts.name = SHARED_FLOW_NAME;
    opts.directory = path.join(__dirname, '../test/fixtures/employees-sf');
    apigeetool.deploySharedflow(opts, function (err, result) {
      if (verbose) {
        console.log('Deploy result = %j', result);
      }
      if (err) {
        done(err);
      } else {
        try {
          if (Array.isArray(result)) {
            result = result[0]
          }
          assert.equal(result.name, SHARED_FLOW_NAME);
          assert.equal(result.environment, config.environment);
          assert.equal(result.state, 'deployed');
          // assert.equal(result.uris.length, 1);
          assert(typeof result.revision === 'number');
          deployedRevision = result.revision;
          // deployedUri = result.uris[0];
          done();
        } catch (e) {
          done(e);
        }
      }
    });
  });

  it('listSharedFlowDeployments', function(done) {
    var opts = baseOpts();
    delete opts.environment;
    opts.name = SHARED_FLOW_NAME;
    opts.revision = 1;

    apigeetool.listSharedflowDeployments(opts, function(err, result) {
      if (verbose) {
        console.log('listSharedFlowDeployments result = %j', result);
      }
      if (err) {
        done(err);
      } else { 
        try {
          result = result.deployments[0];
          assert.equal(result.name, SHARED_FLOW_NAME);
          assert.equal(result.environment, config.environment);
          assert.equal(result.state, 'deployed');
          assert(typeof result.revision === 'number');
          done();
        } catch (e) {
          done(e);
        }
      }
    });
  });


  it('fetchSharedFlow', function(done) {
    var opts = baseOpts();
    opts.name = SHARED_FLOW_NAME;
    opts.revision = 1

    apigeetool.fetchSharedflow(opts, function(err, result) {
      if (verbose) {
        console.log('fetchSharedFlow result: %j', result);
      }
      if (err) {
        done(err);
      } else { done(); }
    });
  });

  it('getPreviousSharedFlow', function(done) {
    var opts = baseOpts();
    opts.flowHookName = "PreProxyFlowHook";

    apigeetool.getFlowHook(opts, function(err, result) {
      if (verbose) {
        console.log('getPreviousSharedFlow result = %j', result);
      }
      if (err) {
        done(err);
      } else {
        if( result.sharedFlow ) {
          prevSharedFlow = result.sharedFlow;
        }
        done();
      }
    });
  });

  it('attachFlowHook', function(done) {
    var opts = baseOpts();
    opts.flowHookName = "PreProxyFlowHook";
    opts.sharedFlowName = SHARED_FLOW_NAME;

    apigeetool.attachFlowHook(opts, function(err, result) {
      if (verbose) {
        console.log('attachFlowHook result = %j', result);
      }
      if (err) {
        done(err);
      } else {
        done();
      }
    });
  });

  it('detachFlowHook', function(done) {
    var opts = baseOpts();
    opts.flowHookName = "PreProxyFlowHook";

    apigeetool.detachFlowHook(opts, function(err, result) {
      if (verbose) {
        console.log('detachFlowHook result = %j', result);
      }
      if (err) {
        done(err);
      } else {
        done();
      }
    });
  });

  it('re-attachFlowHook', function(done) {
    if( prevSharedFlow ) {
      var opts = baseOpts();
      opts.flowHookName = "PreProxyFlowHook";
      opts.sharedFlowName = prevSharedFlow;

      apigeetool.attachFlowHook(opts, function(err, result) {
        if (verbose) {
          console.log('prevSharedFlow ' + prevSharedFlow );
          console.log('re-attachFlowHook result = %j', result);
        }
        if (err) {
          done(err);
        } else {
          done();
        }
      });
    } else {
      done();
    }
  });

  it('undeploySharedFlow', function(done) {
    var opts = baseOpts();
    opts.name = SHARED_FLOW_NAME;

    apigeetool.undeploySharedflow(opts, function(err, result) {
      if (err) {
        done(err);
      } else { // If response is non-200 it throws an Error
        done();
      }
    });
  });

  it('deleteSharedFlow', function(done) {
    var opts = baseOpts();
    opts.name = SHARED_FLOW_NAME;
    apigeetool.deleteSharedflow(opts, done);
  });
}); // end shared flow tests

describe('User Roles and Permissions', function() { //  it
  this.timeout(REASONABLE_TIMEOUT);
  
  it('Create Role', function (done) {
    var opts = baseOpts();
    opts.roleName = ROLE_NAME;

    apigeetool.createRole(opts, function (err, result) {
      if (verbose) {
        console.log('Create Role result = %j', result);
      }
      if (err) { done(err); } else { done(); }
    });
  });

  it('Get Role', function (done) {
    var opts = baseOpts();
    opts.roleName = ROLE_NAME;

    apigeetool.getRole(opts, function (err, result) {
      if (verbose) {
        console.log('Get Role result = %j', result);
      }
      if (err) { done(err); } else { done(); }
    });
  });

  it('List Roles', function (done) {
    var opts = baseOpts();

    apigeetool.listRoles(opts, function (err, result) {
      if (verbose) {
        console.log('List Roles result = %j', result);
      }
      if (err) { done(err); } else { 
        assert.equal( result.includes(ROLE_NAME), true );
        done(); 
      }
    });
  });

  it('Set Role Permissions', function (done) {
    var opts = baseOpts();
    opts.roleName = ROLE_NAME;
    opts.permissions = '[{"path":"/userroles","permissions":["get"]}]';

    apigeetool.setRolePermissions(opts, function (err, result) {
      if (verbose) {
        console.log('Set Role Permissions result = %j', result);
      }
      if (err) { done(err); } else { done(); }
    });
  });

  it('Get Role Permissions', function (done) {
    var opts = baseOpts();
    opts.roleName = ROLE_NAME;

    apigeetool.getRolePermissions(opts, function (err, result) {
      if (verbose) {
        console.log('Get Role Permissions result = %j', result);
      }
      if (err) { done(err); } else { done(); }
    });
  });

  it('Assign User to Role', function (done) {
    var opts = baseOpts();
    opts.roleName = ROLE_NAME;
    opts.email = config.useremail;

    apigeetool.assignUserRole(opts, function (err, result) {
      if (verbose) {
        console.log('Assign User to Role result = %j', result);
      }
      if (err) { done(err); } else { done(); }
    });
  });

  it('Verify User in Role', function (done) {
    var opts = baseOpts();
    opts.roleName = ROLE_NAME;
    opts.email = config.useremail;

    apigeetool.verifyUserRole(opts, function (err, result) {
      if (verbose) {
        console.log('Verify User in Role result = %j', result);
      }
      if (err) { done(err); } else { 
        assert.equal( result.emailId, opts.email);
        done(); 
      }
    });
  });

  it('List Users in a Role', function (done) {
    var opts = baseOpts();
    opts.roleName = ROLE_NAME;
    opts.email = config.useremail;

    apigeetool.listRoleUsers(opts, function (err, result) {
      if (verbose) {
        console.log('List Users in a Role result = %j', result);
      }
      if (err) { done(err); } else { 
        assert.equal( result.includes(opts.email), true);
        done(); 
      }
    });
  });

  it('Verify access allowed', function (done) {
    var opts = baseOpts();
    opts.netrc = false;
    opts.username = config.useremail;
    opts.password = config.userpassword;
    apigeetool.listRoles(opts, function (err, result) {
      if (verbose) {
        console.log('Verify access allowed for user %s result = %j', config.useremail, result);
      }
      if (err) { done(err); } else { done(); }
    });
  });

  it('Remove User from Role', function (done) {
    var opts = baseOpts();
    opts.roleName = ROLE_NAME;
    opts.email = config.useremail;

    apigeetool.removeUserRole(opts, function (err, result) {
      if (verbose) {
        console.log('Remove User from Role result = %j', result);
      }
      if (err) { done(err); } else { done(); }
    });
  });

  it('Delete Role', function (done) {
    var opts = baseOpts();
    opts.roleName = ROLE_NAME;

    apigeetool.deleteRole(opts, function (err, result) {
      if (verbose) {
        console.log('Delete Role result = %j', result);
      }
      if (err) { done(err); } else { done(); }
    });
  });
}); // End User Roles and Permissions

function baseOpts() {
  var o = {
    organization: config.organization,
    username: config.username,
    password: config.password,
    environments: config.environment,
    verbose: config.verbose,
    debug: config.debug,
    environment: config.environment,
    token: config.token,
    netrc: config.netrc
  };
  if (config.baseuri) {
    o.baseuri = config.baseuri;
  }
  return o;
}
