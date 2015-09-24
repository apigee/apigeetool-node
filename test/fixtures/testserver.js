/*
 * This server mocks the Apigee Edge API for deployment test purposes.
 */

var express = require('express');
var connect = require('connect');
var jsonParser = require('body-parser').json();

var app = express();

var PORT = process.env.PORT || 9000;

app.use(jsonParser);

app.get('/v1/o', getOrganizations);
app.get('/v1/organizations', getOrganizations);
app.get('/v1/o/:orgName', getOrganization);
app.get('/v1/organizations/:orgName', getOrganization);
app.get('/v1/o/:orgName/e', getEnvironments);
app.get('/v1/organizations/:orgName/environments', getEnvironments);
app.get('/v1/o/:orgName/e/:envName', getEnvironment);
app.get('/v1/organizations/:orgName/environments/:envName', getEnvironment);
app.get('/v1/o/:orgName/e/:envName/virtualhosts', getVHosts);
app.get('/v1/organizations/:orgName/environments/:envName/virtualhosts', getVHosts);
app.get('/v1/o/:orgName/e/:envName/virtualhosts/:vhName', getVHost);
app.get('/v1/organizations/:orgName/environments/:envName/virtualhosts/:vhName', getVHost);

app.route('/v1/o/:orgName/apis').get(getApis).post(addApi);
app.route('/v1/organizations/:orgName/apis').get(getApis).post(addApi);
app.route('/v1/o/:orgName/apis/:apiName').get(getApi).delete(deleteApi);
app.route('/v1/organizations/:orgName/apis/:apiName').get(getApi).delete(deleteApi);
app.route('/v1/o/:orgName/apis/:apiName/revisions').get(getRevisions).post(addRevision);
app.route('/v1/organizations/:orgName/apis/:apiName/revisions').get(getRevisions).post(addRevision);
app.route('/v1/o/:orgName/apis/:apiName/revisions/:revNum').get(getRevision).delete(deleteRevision);
app.route('/v1/organizations/:orgName/apis/:apiName/revisions/:revNum').get(getRevision).delete(deleteRevision);

console.log('Listening on %d', PORT);
app.listen(PORT);

// Organizations and environments are hard-coded here. Could
// load from a file later.

var OrgData = require('./orgdata');

function getOrganizations(req, resp) {
  var o = [];
  for (n in OrgData) {
    o.push(n);
  }
  resp.send(o);
}

function getOrganization(req, resp) {
  var orgName = req.param('orgName');
  var org = OrgData[orgName];
  if (org) {
    var r = {
      name: orgName,
      displayName: orgName
    };
    resp.send(r);
  } else {
    resp.send(404);
  }
}

function getEnvironments(req, resp) {
  var org = OrgData[req.param('orgName')];
  if (!org) {
    resp.send(404);
    return;
  }

  var es = [];
  for (n in org.environments) {
    es.push(n);
  }
  resp.send(es);
}

function getEnvironment(req, resp) {
  var org = OrgData[req.param('orgName')];
  if (!org) {
    resp.send(404);
    return;
  }
  var envName = req.param('envName');
  var env = org.environments[envName];
  if (!env) {
    resp.send(404);
    return;
  }

  var ret = {
    name: envName
  }
  resp.send(ret);
}

function getVHosts(req, resp) {
  var org = OrgData[req.param('orgName')];
  if (!org) {
    resp.send(404);
    return;
  }
  var envName = req.param('envName');
  var env = org.environments[envName];
  if (!env) {
    resp.send(404);
    return;
  }

  var vh = [];
  for (n in env.virtualhosts) {
    vh.push(n);
  }
  resp.send(vh);
}

function getVHost(req, resp) {
  var org = OrgData[req.param('orgName')];
  if (!org) {
    resp.send(404);
    return;
  }
  var env = org.environments[req.param('envName')];
  if (!env) {
    resp.send(404);
    return;
  }
  var vhName = req.param('vhName');
  var vh = env.virtualhosts[vhName];
  if (!vh) {
    resp.send(404);
    return;
  }

  var v = {
    name: vhName,
    port: vh.port,
    hostAliases: vh.hostAliases
  }
  resp.send(v);
}

// API deployments are set manually by the tool

function getApis(req, resp) {
  var org = OrgData[req.param('orgName')];
  if (!org) {
    resp.send(404);
    return;
  }
  var as = [];
  for (n in org.apis) {
    as.push(n);
  }
  resp.send(as);
}

function addApi(req, resp) {
  var org = OrgData[req.param('orgName')];
  if (!org) {
    resp.send(404);
    return;
  }
  if (!req.body) {
    resp.send(400);
    return;
  }

  var apiName = req.body.name;
  if (!apiName) {
    resp.send(400);
    return;
  }
  if (org.apis[apiName]) {
    resp.send(409);
    return;
  }

  var newApi = req.body;
  if (newApi.name !== apiName) {
    resp.send(400);
    return;
  }
  newApi.revisions = {};
  org.apis[apiName] = newApi;
  resp.send(201, req.body);
}

function getApi(req, resp) {
  var org = OrgData[req.param('orgName')];
  if (!org) {
    resp.send(404);
    return;
  }
  var api = org.apis[req.param('apiName')];
  if (!api) {
    resp.send(404);
    return;
  }

  resp.send(api);
}

function deleteApi(req, resp) {
  var org = OrgData[req.param('orgName')];
  if (!org) {
    resp.send(404);
    return;
  }
  var apiName = req.param('apiName');
  var api = org.apis[apiName];
  if (!api) {
    resp.send(404);
    return;
  }
  delete org.apis[apiName];
  resp.send(200, api);
}

function getRevisions(req, resp) {
  var org = OrgData[req.param('orgName')];
  if (!org) {
    resp.send(404);
    return;
  }
  var api = org.apis[req.param('apiName')];
  if (!api) {
    resp.send(404);
    return;
  }

  var revs = [];
  for (n in api.revisions) {
    revs.push(n);
  }
  resp.send(revs);
}

function getRevision(req, resp) {
  var org = OrgData[req.param('orgName')];
  if (!org) {
    resp.send(404);
    return;
  }
  var api = org.apis[req.param('apiName')];
  if (!api) {
    resp.send(404);
    return;
  }
  var revNum = req.param('revNum');
  if (revNum in api.revisions) {
    resp.send(api.revisions[revNum]);
  } else {
    resp.send(404);
  }
}

function addRevision(req, resp) {
  var org = OrgData[req.param('orgName')];
  if (!org) {
    resp.send(404);
    return;
  }
  var api = org.apis[req.param('apiName')];
  if (!api) {
    resp.send(404);
    return;
  }
  var revNum = req.param('revNum');
  if (api.revisions[revNum]) {
    resp.send(409);
    return;
  }
  api.revisions[revNum] = req.body;
  resp.send(req.body);
}

function deleteRevision(req, resp) {
  var org = OrgData[req.param('orgName')];
  if (!org) {
    resp.send(404);
    return;
  }
  var api = org.apis[req.param('apiName')];
  if (!api) {
    resp.send(404);
    return;
  }
  var revNum = req.param('revNum');
  var rev = api.revisions[revNum];
  if (rev) {
    delete api.revisions[revNum];
    resp.send(rev);
  } else {
    resp.send(404);
  }
}
