# apigeetool

This is a tool for deploying API proxies and Node.js applications to the Apigee Edge platform. The tool also lets you list and undeploy API proxies.

* [Installation](#installation)
* [What you need to know about apigeetool](#whatyouneed)
* [Command reference and examples](#reference)
* [SDK reference and examples](#sdkreference)
* [Original tool](#original)
* [Contribution](#contrib)

# <a name="installation"></a>Installation

`apigeetool` is a Node.js module and you can install it using npm:

`npm install -g apigeetool`

*NOTE*: The `-g` option places the apigeetool command in your PATH. On "\*nix"-based machines, `sudo` may be required with the `-g` option. If you do not use `-g`, then you need to add the apigeetool command to your PATH manually. Typically, the `-g` option places modules in: `/usr/local/lib/node_modules/apigee-127` on *nix-based machines.

# <a name="whatyouneed"></a>What you need to know about apigeetool

You must have an account on Apigee Edge to perform any `apigeetool` functions. These functions include:

* deploying an API proxy to Edge,
* undeploying an API proxy from Edge,
* deploying Node.js apps to Edge,
* listing deployed API proxies on Edge,
* retrieving deployed proxies and apps from Edge,
* deleting proxy definitions from Edge, and
* retreiving log messages from Node.js apps deployed to Edge.
* create or delete an API product in Edge
* create or delete a Developer in Edge
* create or delete a Developer Application in Edge
* create or delete a Cache resource in Edge
* create, retrieve or delete a KVM Map in Edge
* create, retrieve or delete a KVM Entry in Edge

You need to be familiar with basic concepts and features of Apigee Edge such as API proxies, organizations, and environments.

For more information, refer to the [Apigee Edge docs](http://apigee.com/docs/).

# <a name="commonargs"></a>Common Parameters

The following parameters are available on all of the commands supported by
this tool:

`--baseuri   -L`
(optional) The base URI for you organization on Apigee Edge. The default is the base URI for Apigee cloud deployments is `api.enterprise.apigee.com`. For on-premise deployments, the base URL may be different.

`--header   -H`
(optional) Adds a header to the API call.  Format is header:value.  This option may be used multiple times if more than one header is needed.

`--cafile -c`
(optional) The names of one of more PEM files that represent trusted certificate authorities.
Multiple file names may be comma-separated. Use this to communicate with an installation
of Apigee Edge that uses a custom certificate for API calls.

`--debug -D`
(optional) Prints additional information about the deployment, including router and message processor IDs.

`--help  -h`
(optional) Displays help on this command.

`--insecure -k`
(optional) Do not validate the TLS certificate of the HTTPS target for API calls.
Use this to communicate with an installation of Apigee Edge that does not use a
trusted TLS certificate.

`--asynclimit -a`
(optional) Limit for the maximum number of operations performed concurrently.
Currently this only affects file uploads in the `deploynodeapp` command. Defaults to 4.

`--json  -j`
(optional) Formats the command's response as a JSON object.

`--organization  -o`
(required) The name of the organization to deploy to. May be set as an environment variable APIGEE_ORGANIZATION.

`--password  -p`
(required) Your Apigee account password. May be set as an environment variable APIGEE_PASSWORD.

`--username  -u`
(required) Your Apigee account username. May be set as an environment variable APIGEE_USERNAME.

`--token -t`
(optional) Your Apigee access token. Use this in lieu of -u / -p

`--netrc  -N`
(optional) Use this in lieu of -u / -p, to tell apigeetool to retrieve credentials from your .netrc file.

`--verbose   -V`
(optional) Prints additional information as the deployment proceeds.

# <a name="reference"></a>Command reference and examples

* [deploynodeapp](#deploynodeapp)
* [deployhostedtarget](#deployhostedtarget)
* [deployproxy](#deployproxy)
* [undeploy](#undeploy)
* [listdeployments](#listdeployments)
* [fetchproxy](#fetchproxy)
* [getlogs](#getlogs)
* [delete](#delete)
* [deploySharedflow](#deploySharedflow)
* [undeploySharedflow](#undeploySharedflow)
* [listSharedflowDeployments](#listSharedflowDeployments)
* [fetchSharedflow](#fetchSharedflow)
* [deleteSharedflow](#deleteSharedflow)
* [createdeveloper](#createdeveloper)
* [deletedeveloper](#deletedeveloper)
* [createproduct](#createproduct)
* [deleteproduct](#deleteproduct)
* [createapp](#createapp)
* [deleteapp](#deleteapp)
* [createappkey](#createappkey)
* [createcache](#createcache)
* [deletecache](#deletecache)
* [createkvmmap](#createkvmmap)
* [addEntryToKVM](#addEntryToKVM)
* [getkvmmap](#getkvmmap)
* [getKVMentry](#getKVMentry)
* [deletekvmmap](#deletekvmmap)
* [deleteKVMentry](#deleteKVMentry)


## <a name="deploynodeapp"></a>deploynodeapp

Deploys a Node.js app to Apigee Edge as an API proxy. With your Node.js app deployed to Edge, you can take advantage of Edge features like security, quotas, caching, analytics, trace tool, and more.

#### Examples

Deploys a Node.js app to Apigee Edge.

    apigeetool deploynodeapp -u sdoe@apigee.com -o sdoe -e test -n 'Test Node App 2' -d . -m app.js -b /node2

Deploys a Node.js app to both the default (HTTP) and secure (HTTPS) virtual hosts.

    apigeetool deploynodeapp -u sdoe@apigee.com -o sdoe -e test -n 'Test Node App 2' -d . -m app.js -b /node2 -v default,secure

#### Required parameters

The following parameters are required. However, if any are left unspecified
on the command line, and if apigeetool is running in an interactive shell,
then apigeetool will prompt for them.

For example, if you do not specify a password using "-p", apigeetool will
prompt for the password on the command line.

See [Common Parameters](#commonargs) for a list of additional parameters, including
the "-u" and "-p" parameters for username and password, and the "-o" parameter
for organization name, all of which are required.

`--environments  -e`
(required) The name(s) of the environment(s) to deploy to (comma-delimited).

#### Optional parameters

`--api   -n`
(optional) The name of the API proxy. The name of the API proxy must be unique within an organization. The characters you are allowed to use in the name are restricted to the following: `A-Z0-9._\-$ %`. If not specified, will attempt to use name from package.json.

`--base-path -b`
(optional) The base path of the API proxy. For example, for this API proxy, the base path is `/example-proxy`: `http://myorg-test.apigee.net/example-proxy/resource1`.

`--directory -d`
(optional) The path to the root directory of the API proxy on your local system. Will attempt to use current directory is none is specified.

`--import-only   -i`
(optional) Imports the API proxy to Apigee Edge but does not deploy it.

`--main  -m`
(optional) The Node.js file you want to be the main file. If not specified, will attempt to use main from package.json.

`--preserve-policies -P`
(optional) If specified, the highest revision of the existing proxy will be downloaded and the node code in your directory will be overlayed upon it to create a resulting proxy that contains both any existing policies and the node code in the directory. If there is no existing revision, this option will have no effect.

`--resolve-modules   -R`
(optional) If the API proxy includes Node.js modules (e.g., in a `node_modules` directory), this option updates them on Apigee Edge without uploading them from your system. Basically, it's like running "npm install" on Apigee Edge in the root directory of the API proxy bundle.

`--production`
(optional) Indicates if Apigee Edge should use the `--production` flag during `npm install`. Defaults to `true`, example of disabling the flag would be `--production false`.

`--upload-modules    -U`  
(optional) If specified, uploads Node.js modules from your system to Apigee Edge rather than resolving the modules directly on Apigee Edge (the default behavior).

`--virtualhosts  -v`
(optional) A comma-separated list of virtual hosts that the deployed app will use. The two most common options are `default` and `secure`. The `default` option is always HTTP and `secure` is always HTTPS. By default, `apigeetool deploynodeapp` uses `default,secure`.

`--bundled-dependencies`
(optional) If specified, the source code will be uploaded with its `bundledDependencies` as defined in the `package.json`.

`--wait-after-import  -W`  
(optional) Number of seconds to delay before deploying node.js proxy.

## <a name="deployhostedtarget"></a>deployhostedtarget

Deploys a Hosted Target to Apigee Edge as an API proxy. With your Hosted Target deployed to Edge, you can take advantage of Edge features like security, quotas, caching, analytics, trace tool, and more.

#### Examples

Deploys a Node.js app as a Hosted Target to Apigee Edge.

    apigeetool deployhostedtarget -u sdoe@apigee.com -o sdoe -e test -n 'test-node-app-2' -b /node2

Deploys a Node.js app as a Hosted Target to both the default (HTTP) and secure (HTTPS) virtual hosts.

    apigeetool deployhostedtarget -u sdoe@apigee.com -o sdoe -e test -n 'test-node-app-2' -b /node2 -v default,secure

#### Required parameters

The following parameters are required. However, if any are left unspecified
on the command line, and if apigeetool is running in an interactive shell,
then apigeetool will prompt for them.

For example, if you do not specify a password using "-p", apigeetool will
prompt for the password on the command line.

See [Common Parameters](#commonargs) for a list of additional parameters, including
the "-u" and "-p" parameters for username and password, and the "-o" parameter
for organization name, all of which are required.

`--api   -n`
The name of the API proxy. The name of the API proxy must be unique within an organization. The characters you are allowed to use in the name are restricted to the following: `a-z0-9._\-$ %`.

`--environments  -e`
(required) The name(s) of the environment(s) to deploy to (comma-delimited).

#### Optional parameters

`--base-path -b`
(optional) The base path of the API proxy. For example, for this API proxy, the base path is `/example-proxy`: `http://myorg-test.apigee.net/example-proxy/resource1`.

`--directory -d`
(optional) The path to the root directory of the API proxy on your local system. Will attempt to use current directory is none is specified.

`--import-only   -i`
(optional) Imports the API proxy to Apigee Edge but does not deploy it.

`--preserve-policies -P`
(optional) If specified, the highest revision of the existing proxy will be downloaded and the source code in your directory will be overlayed upon it to create a resulting proxy that contains both any existing policies and the source code in the directory. If there is no existing revision, this option will have no effect.

`--virtualhosts  -v`
(optional) A comma-separated list of virtual hosts that the deployed app will use. The two most common options are `default` and `secure`. The `default` option is always HTTP and `secure` is always HTTPS. By default, `apigeetool deployhostedtarget` uses `default,secure`.

`--bundled-dependencies`
(optional) If specified, the source code will be uploaded with its `bundledDependencies` as defined in the `package.json`.

## <a name="deployproxy"></a>deployproxy

Deploys an API proxy to Apigee Edge. If the proxy is currently deployed, it will be undeployed first, and the newly deployed proxy's revision number is incremented.

#### Example

Deploys an API proxy called example-proxy to Apigee Edge. Per the `-d` flag, the command is executed in the root directory of the proxy bundle.

    apigeetool deployproxy  -u sdoe@example.com -o sdoe  -e test -n example-proxy -d .

#### Required parameters

The following parameters are required. However, if any are left unspecified
on the command line, and if apigeetool is running in an interactive shell,
then apigeetool will prompt for them.

See [Common Parameters](#commonargs) for a list of additional parameters, including
the "-u" and "-p" parameters for username and password, and the "-o" parameter
for organization name, all of which are required.

`--api   -n`
(required) The name of the API proxy. Note: The name of the API proxy must be unique within an organization. The characters you are allowed to use in the name are restricted to the following: `A-Z0-9._\-$ %`.

`--environments  -e`
(required) The name(s) of the environment(s) to deploy to (comma delimited).

#### Optional parameters

`--base-path -b`
(optional) The base path of the API proxy. For example, for this API proxy, the base path is /example-proxy: http://myorg-test.apigee.net/example-proxy/resource1.

`--directory -d`
(optional) The path to the root directory of the API proxy on your local system. Will attempt to use current directory is none is specified.

`--import-only   -i`
(optional) Imports the API proxy to Apigee Edge but does not deploy it.

`--resolve-modules   -R`
(optional) If the API proxy includes Node.js modules (e.g., in a `node_modules` directory), this option updates them on Apigee Edge without uploading them from your system. Basically, it's like running npm on Apigee Edge in the root directory of the API proxy bundle.

`--upload-modules    -U`
(optional) If specified, uploads Node.js modules from your system to Apigee Edge.

`--bundled-dependencies`
(optional) If specified, the `node` & `hosted` resources will be uploaded with their `bundledDependencies` as defined in their respective `package.json` files.

`--wait-after-import  -W`  
(optional) Number of seconds to delay before deploying node.js proxy.

## <a name="deployExistingRevision"></a>deployExistingRevision

Deploys an existing API proxy revision to Apigee Edge. If a different revision is already deployed to the targeted environments, it will be undeployed and replaced with the requested revision.

#### Example

Deploys an existing API proxy revision called example-proxy to Apigee Edge.

    apigeetool deployExistingRevision  -u sdoe@example.com -o sdoe  -e test -n example-proxy -r 1

#### Required parameters

The following parameters are required. However, if any are left unspecified
on the command line, and if apigeetool is running in an interactive shell,
then apigeetool will prompt for them.

See [Common Parameters](#commonargs) for a list of additional parameters, including
the "-u" and "-p" parameters for username and password, and the "-o" parameter
for organization name, all of which are required.

`--api   -n`  
(required) The name of the API proxy. Note: The name of the API proxy must be unique within an organization. The characters you are allowed to use in the name are restricted to the following: `A-Z0-9._\-$ %`.

`--environments  -e`  
(required) The name(s) of the environment(s) to deploy to (comma delimited).  

`--revision -r`
(required) The existing revision of the proxy to be deployed.

## <a name="undeploy"></a>undeploy

Undeploys a named API proxy or Node.js app deployed on Apigee Edge.

#### Example

Undeploy the proxy named "example-proxy".

    apigeetool undeploy -u sdoe@example.com -o sdoe  -n example-proxy -e test -D

#### Required parameters

The following parameters are required. However, if any are left unspecified
on the command line, and if apigeetool is running in an interactive shell,
then apigeetool will prompt for them.

See [Common Parameters](#commonargs) for a list of additional parameters, including
the "-u" and "-p" parameters for username and password, and the "-o" parameter
for organization name, all of which are required.

`--api   -n`
(required) The name of the API proxy or app to undeploy.

`--environment   -e`
(required) The environment on Apigee Edge where the API proxy or app is currently deployed.

#### Optional parameters

`--revision  -r`
(optional) Specify the revision number of the API proxy to undeploy.

## <a name="listdeployments"></a>listdeployments

Lists the API proxies deployed on Apigee Edge for the specified organization. Lets you filter the result by API proxy name or environment.

#### Examples

List all API proxies in an organization:

    $ apigeetool listdeployments -u sdoe@example.com -o sdoe -e test`

List API proxies named "example-proxy":

    $ apigeetool listdeployments -u sdoe@example.com -o sdoe -n example-proxy

#### Required parameters

See [Common Parameters](#commonargs) for a list of additional parameters, including
the "-u" and "-p" parameters for username and password, and the "-o" parameter
for organization name, all of which are required.

#### Required, mutually exclusive parameters

`--api   -n`
(You must specify either `api` or `environment` in this command) The name of the API proxy to list.

`--environment   -e`
(You must specify either `api` or `environment` in this command) The environment for which you want to list deployments. When `-e` is specified, the command lists all deployed proxies in the environment.

#### Optional parameters

`--long  -l`
(optional) Returns additional information about the API proxy or Node.js app,
including the URL to use as the base path for each one.

`--revision  -r`
(optional) Filters the list by the specified revision number.

## <a name="fetchproxy"></a>fetchproxy

Fetches a deployed API proxy or Node.js application from Apigee Edge. The
result will be a ZIP file that contains the contents of the entire
proxy.

Regardless of whether "deployproxy" or "deploynodeapp" is used to deploy the
proxy or app, the result of "fetchproxy" will always be a ZIP file that
represents an API proxy. The resulting proxy may be "unzipped" and
re-deployed using "deployproxy."

#### Example

Fetch the deployed proxy named "example-proxy".

    apigeetool fetchproxy -u sdoe@example.com -o sdoe -n example-proxy -r 1

#### Required parameters

The following parameters are required. However, if any are left unspecified
on the command line, and if apigeetool is running in an interactive shell,
then apigeetool will prompt for them.

See [Common Parameters](#commonargs) for a list of additional parameters, including
the "-u" and "-p" parameters for username and password, and the "-o" parameter
for organization name, all of which are required.

`--api  -n`
(required) The name of the API proxy or app to undeploy.

`--revision  -r`
(required) Specifies the revision to retrieve.

#### Optional parameters

`--file -f`
(optional) The name of the file to write as the result. If not specified,
then the file name will be the same as the name passed to the "name"
parameter.

## <a name="delete"></a>delete

Delete all revisions of a proxy from Apigee Edge.

It is an error to delete a proxy that still has deployed revisions. Revisions
must be undeployed using "undeploy" before this command may be used.

#### Example

Delete the proxy named "example-proxy".

    apigeetool delete -u sdoe@example.com -o sdoe -n example-proxy

#### Required parameters

The following parameters are required. However, if any are left unspecified
on the command line, and if apigeetool is running in an interactive shell,
then apigeetool will prompt for them.

See [Common Parameters](#commonargs) for a list of additional parameters, including
the "-u" and "-p" parameters for username and password, and the "-o" parameter
for organization name, all of which are required.

`--api  -n`
(required) The name of the API proxy or app to undeploy.

## <a name="getlogs"></a>getlogs

Retrieve the last set of log records from a Node.js application or Hosted Target deployed to Apigee Edge.

The resulting log files will be written directly to standard output. Each is prefixed with:

* A timestamp, in UTC by default
* An indication of whether the log record came from standard output or standard error
* A unique identifier of the server where the log was generated.

Since Apigee Edge, by default, deploys each Node.js application on at least two
different servers, most applications will see at least two sets of logs. These are
sorted in time stamp order.

The log records from this command come from a cache inside Apigee Edge that retains
the last 500 lines of log output from each server. The cache is a circular buffer,
so older messages will be discarded when it fills up.

By default, the last set of log records will be pulled and written to standard output. However, if the
"-f" option is used, then "apigeetool" will poll Edge for new log records and append them to standard
output, in the manner of "tail -f". (By default, the tool polls every
five seconds).

For example, a set of log records might look like this:

<pre>
[2014-11-05T01:30:01.530Z nodejs/stderr svr.362] *** Starting script
[2014-11-05T01:30:09.182Z nodejs/stderr svr.362] 2014-11-05T01:30:09.181Z - debug: 1/4. this is a debug log
[2014-11-05T01:30:09.186Z nodejs/stdout svr.362] 2014-11-05T01:30:09.186Z - info: 2/4. this is an info log
[2014-11-05T01:30:09.187Z nodejs/stdout svr.362] 2014-11-05T01:30:09.187Z - warn: 3/4. this is a warning log
[2014-11-05T01:30:09.188Z nodejs/stderr svr.362] 2014-11-05T01:30:09.188Z - error: 4/4. this is an error log
[2014-11-05T01:48:21.419Z nodejs/stderr svr.828] *** Starting script
[2014-11-05T01:48:28.637Z nodejs/stderr svr.828] js-bson: Failed to load c++ bson extension, using pure JS version
[2014-11-05T01:48:29.801Z nodejs/stderr svr.828] 2014-11-05T01:48:29.800Z - debug: 1/4. this is a debug log
[2014-11-05T01:48:29.804Z nodejs/stdout svr.828] 2014-11-05T01:48:29.804Z - info: 2/4. this is an info log
[2014-11-05T01:48:29.805Z nodejs/stdout svr.828] 2014-11-05T01:48:29.805Z - warn: 3/4. this is a warning log
[2014-11-05T01:48:29.806Z nodejs/stderr svr.828] 2014-11-05T01:48:29.806Z - error: 4/4. this is an error log
</pre>

#### Required Parameters

The following parameters are required. However, if any are left unspecified
on the command line, and if apigeetool is running in an interactive shell,
then apigeetool will prompt for them.

See [Common Parameters](#commonargs) for a list of additional parameters, including
the "-u" and "-p" parameters for username and password, and the "-o" parameter
for organization name, all of which are required.

`--api  -n`
(required) The name of the deployed app to get logs from.

`--environment   -e`
(required) The environment on Apigee Edge where the app is currently deployed.

#### Optional Parameters

`--streaming  -f`
(optional) If specified, do not exit, but instead poll Apigee Edge for new log
records and write them to standard output in the manner of "tail -f."

`--timezone  -z`
(optional) If specified, use the time zone to format the timestamps on the
log records. If not specified, then the default is UTC. The timestamp name
should be a name such as "PST."

`--hosted-build`
(optional) If specified will attempt to get the build logs for a deployed
Hosted Target.

`--hosted-runtime`
(optional) If specified will attempt to get the runtime logs for a deployed
Hosted Target.

## <a name="deploySharedflow"></a>deploySharedflow

Deploys a sharedFlow to Apigee Edge. If the sharedFlow is currently deployed, it will be undeployed first, and the newly deployed sharedflow's revision number is incremented.

#### Example

Deploys a SharedFlow called example-sf to Apigee Edge. Per the `-d` flag, the command is executed in the root directory of the sharedflow bundle.

    apigeetool deploySharedflow  -u sdoe@example.com -o sdoe  -e test -n example-sf -d .

#### Required parameters

The following parameters are required. However, if any are left unspecified
on the command line, and if apigeetool is running in an interactive shell,
then apigeetool will prompt for them.

See [Common Parameters](#commonargs) for a list of additional parameters, including
the "-u" and "-p" parameters for username and password, and the "-o" parameter
for organization name, all of which are required.

`--name   -n`
(required) The name of the SharedFlow. Note: The name of the SharedFlow must be unique within an organization. The characters you are allowed to use in the name are restricted to the following: `A-Z0-9._\-$ %`.

`--environments  -e`
(required) The name(s) of the environment(s) to deploy to (comma delimited).

#### Optional parameters

`--directory -d`
(optional) The path to the root directory of the sharedflow on your local system. Will attempt to use current directory is none is specified.

`--import-only   -i`
(optional) Imports the sharedflow to Apigee Edge but does not deploy it.

## <a name="undeploySharedflow"></a>undeploySharedflow

Undeploys a named API proxy or Node.js app deployed on Apigee Edge.

#### Example

Undeploy the proxy named "example-sf".

    apigeetool undeploySharedflow -u sdoe@example.com -o sdoe  -n example-sf -e test -D

#### Required parameters

The following parameters are required. However, if any are left unspecified
on the command line, and if apigeetool is running in an interactive shell,
then apigeetool will prompt for them.

See [Common Parameters](#commonargs) for a list of additional parameters, including
the "-u" and "-p" parameters for username and password, and the "-o" parameter
for organization name, all of which are required.

`--name   -n`
(required) The name of the sharedflow to undeploy.

`--environment   -e`
(required) The environment on Apigee Edge where the sharedflow is currently deployed.

#### Optional parameters

`--revision  -r`
(optional) Specify the revision number of the sharedflow to undeploy.

## <a name="listSharedflowDeployments"></a>listSharedflowDeployments

Lists the sharedflows deployed on Apigee Edge for the specified organization. Lets you filter the result by API proxy name or environment.

#### Examples

List all Sharedflows in an organization:

    $ apigeetool listSharedflowDeployments -u sdoe@example.com -o sdoe -e test` #Won't work due to missing API

List Sharedflows named "example-sf":

    $ apigeetool listSharedflowDeployments -u sdoe@example.com -o sdoe -n example-sf

#### Required parameters

See [Common Parameters](#commonargs) for a list of additional parameters, including
the "-u" and "-p" parameters for username and password, and the "-o" parameter
for organization name, all of which are required.

#### Required, mutually exclusive parameters

`--name   -n`
(You must specify either `name` or `environment` in this command) The name of the Sharedflow to list.

`--environment   -e`
(You must specify either `name` or `environment` in this command) The environment for which you want to list deployments. When `-e` is specified, the command lists all deployed proxies in the environment.

#### Optional parameters

`--revision  -r`
(optional) Filters the list by the specified revision number.

## <a name="fetchSharedflow"></a>fetchSharedFlow

Fetches a sharedFlow from Apigee Edge. The
result will be a ZIP file that contains the contents of the entire
sharedflow.The resulting ZIP file may be "unzipped" and re-deployed using "deploySharedflow."

#### Example

Fetch the deployed proxy named "example-proxy".

    apigeetool fetchSharedflow -u sdoe@example.com -o sdoe -n example-proxy -r 1

#### Required parameters

The following parameters are required. However, if any are left unspecified
on the command line, and if apigeetool is running in an interactive shell,
then apigeetool will prompt for them.

See [Common Parameters](#commonargs) for a list of additional parameters, including
the "-u" and "-p" parameters for username and password, and the "-o" parameter
for organization name, all of which are required.

`--name  -n`
(required) The name of the sharedflow or app to undeploy.

`--revision  -r`
(required) Specifies the revision to retrieve.

#### Optional parameters

`--file -f`
(optional) The name of the file to write as the result. If not specified,
then the file name will be the same as the name passed to the "name"
parameter.

## <a name="deleteSharedflow"></a>deleteSharedflow

Delete all revisions of a sharedflow from Apigee Edge.

It is an error to delete a proxy that still has deployed revisions. Revisions
must be undeployed using "undeploySharedflow" before this command may be used.

#### Example

Delete the proxy named "example-sf".

    apigeetool deleteSharedflow -u sdoe@example.com -o sdoe -n example-sf

#### Required parameters

The following parameters are required. However, if any are left unspecified
on the command line, and if apigeetool is running in an interactive shell,
then apigeetool will prompt for them.

See [Common Parameters](#commonargs) for a list of additional parameters, including
the "-u" and "-p" parameters for username and password, and the "-o" parameter
for organization name, all of which are required.

`--name  -n`
(required) The name of the API proxy or app to undeploy.

## <a name="KVM Operations"></a>KVM Operations

The following commands support the varying scoped of the Apigee KVM.

When just the `--organization` option is present, the operation will correspond to the Organization-scoped KVM.

When the `--organization` and `--environment` options are present, the operation will correspond to the Environment-scoped KVM.

When the `--organization` and `--api` options are present, the operation will correspond to the API-scoped KVM.

### <a name="createkvmmap"></a>createkvmmap

Creates a map in the Apigee KVM with the given name.

#### Example
Create KVM map named "test-map"

    apigeetool createkvmmap -u sdoe@example.com -o sdoe -e test --mapName test-map

#### Required parameters

The following parameters are required. However, if any are left unspecified
on the command line, and if apigeetool is running in an interactive shell,
then apigeetool will prompt for them.

See [Common Parameters](#commonargs) for a list of additional parameters, including
the "-u" and "-p" parameters for username and password, and the "-o" parameter
for organization name, all of which are required.

`--mapName`
(required) The name of the map to be created.

#### Optional parameters

`--environment -e`
(optional) The environment to target for an Environment-scoped KVM operation.

`--api -n`
(optional) The API to target for an API-scoped KVM operation.

`--encrypted`
(optional) Create a encrypted KVM Map.

### <a name="addEntryToKVM"></a>addEntryToKVM

Adds an entry of name:value to the named map in the Apigee KVM.

#### Example

Add entry to KVM with name "test1" and value "value1"

    apigeetool addEntryToKVM -u sdoe@example.com -o sdoe -e test --mapName test-map --entryName test1 --entryValue value1

#### Required parameters

The following parameters are required. However, if any are left unspecified
on the command line, and if apigeetool is running in an interactive shell,
then apigeetool will prompt for them.

See [Common Parameters](#commonargs) for a list of additional parameters, including
the "-u" and "-p" parameters for username and password, and the "-o" parameter
for organization name, all of which are required.

`--mapName`
(required) The name of the map the entry will belong to.

`--entryName`
(required) The name of the entry to be created.

`--entryValue`
(required) The value of the entry to be created.

#### Optional parameters

`--environment -e`
(optional) The environment to target for an Environment-scoped KVM operation.

`--api -n`
(optional) The API to target for an API-scoped KVM operation.

### <a name="getkvmmap"></a>getkvmmap

Retrieves an entire KVM map with all of its entries, by name.

#### Example

Get map named "test-map".

    apigeetool getkvmmap -u sdoe@example.com -o sdoe -e test --mapName test-map

#### Required parameters

The following parameters are required. However, if any are left unspecified
on the command line, and if apigeetool is running in an interactive shell,
then apigeetool will prompt for them.

See [Common Parameters](#commonargs) for a list of additional parameters, including
the "-u" and "-p" parameters for username and password, and the "-o" parameter
for organization name, all of which are required.

`--mapName`
(required) The name of the map to be retrieved.

#### Optional parameters

`--environment -e`
(optional) The environment to target for an Environment-scoped KVM operation.

`--api -n`
(optional) The API to target for an API-scoped KVM operation.

### <a name="getKVMentry"></a>getKVMentry

Retrieve an unencrypted KVM entry from an Apigee KVM map, by name.

#### Example

Retrieve the KVM entry named "test1" in the map "test-map".

    apigeetool getKVMentry -u sdoe@example.com -o sdoe -e test --mapName test-map --entryName test1

#### Required parameters

The following parameters are required. However, if any are left unspecified
on the command line, and if apigeetool is running in an interactive shell,
then apigeetool will prompt for them.

See [Common Parameters](#commonargs) for a list of additional parameters, including
the "-u" and "-p" parameters for username and password, and the "-o" parameter
for organization name, all of which are required.

`--mapName`
(required) The name of the map that the entry belongs to.

`--entryName`
(required) The name of the entry to be retrieved.

#### Optional parameters

`--environment -e`
(optional) The environment to target for an Environment-scoped KVM operation.

`--api -n`
(optional) The API to target for an API-scoped KVM operation.

### <a name="deletekvmmap"></a>deletekvmmap

Deletes an entire map from the Apigee KVM along with all of its entries.

#### Example

Delete map named "test-map".

    apigeetool deletekvmmap -u sdoe@example.com -o sdoe -e test --mapName test-map

#### Required parameters

The following parameters are required. However, if any are left unspecified
on the command line, and if apigeetool is running in an interactive shell,
then apigeetool will prompt for them.

See [Common Parameters](#commonargs) for a list of additional parameters, including
the "-u" and "-p" parameters for username and password, and the "-o" parameter
for organization name, all of which are required.

`--mapName`
(required) The name of the map to be deleted.

#### Optional parameters

`--environment -e`
(optional) The environment to target for an Environment-scoped KVM operation.

`--api -n`
(optional) The API to target for an API-scoped KVM operation.

### <a name="deleteKVMentry"></a>deleteKVMentry

Deletes a single entry by name from an Apigee KVM map.

#### Example

Delete entry named "test1" from the map named "test-map".

    apigeetool deletekvmmap -u sdoe@example.com -o sdoe -e test --mapName test-map --entryName test1

#### Required parameters

The following parameters are required. However, if any are left unspecified
on the command line, and if apigeetool is running in an interactive shell,
then apigeetool will prompt for them.

See [Common Parameters](#commonargs) for a list of additional parameters, including
the "-u" and "-p" parameters for username and password, and the "-o" parameter
for organization name, all of which are required.

`--mapName`
(required) The name of the map that the entry belongs to.

`--entryName`
(required) The name of the entry to be deleted.

#### Optional parameters

`--environment -e`
(optional) The environment to target for an Environment-scoped KVM operation.

`--api -n`
(optional) The API to target for an API-scoped KVM operation.

## <a name="Cache Operations"></a>Cache Operations

### <a name="createcache"></a>createcache

Creates a Cache with the given name.

#### Example
Create Cache map named "test-cache"

    apigeetool createcache -u sdoe@example.com -o sdoe -e test -z test-cache

#### Required parameters

The following parameters are required. However, if any are left unspecified
on the command line, and if apigeetool is running in an interactive shell,
then apigeetool will prompt for them.

See [Common Parameters](#commonargs) for a list of additional parameters, including
the "-u" and "-p" parameters for username and password, and the "-o" parameter
for organization name, all of which are required.

`-z`
(required) The name of the cache to be created.

`--environment -e`
(required) The environment to target.

# <a name="sdkreference"></a>SDK Reference

You could use apigeetool as an SDK to orchestrate tasks that you want to perform with Edge, for eg, deploying an api proxy or running tests etc.

#### Usage Example

    var apigeetool = require('apigeetool')
    var sdk = apigeetool.getPromiseSDK()
    var opts = {
        organization: 'edge-org',
        username: 'edge-user',
        password: 'password',
        environments: 'environment',
    }
    opts.api = APIGEE_PROXY_NAME;
    opts.directory = path.join(__dirname);

    sdk.deployProxy(opts)
        .then(function(result){
            //deploy success
        },function(err){
            //deploy failed
        });

## <a name="createdeveloper"></a>Create Developer

Creates a new Developer in Edge

#### Example

Create a developer.

        //see above for other required options
        opts.email = DEVELOPER_EMAIL
    opts.firstName = 'Test'
    opts.lastName = 'Test1'
    opts.userName = 'runningFromTest123'
    opts.attributes = [
        {
            name: "testAttribute",
            value: "newValue"
        }
    ]

    sdk.createDeveloper(opts)
      .then(function(result){
        //developer created
      },function(err){
        //developer creation failed
      }) ;


## <a name="deletedeveloper"></a>Delete Developer

Delete a Developer in Edge

#### Example

        //see above for other required options
        opts.email = DEVELOPER_EMAIL

    sdk.deleteDeveloper(opts)
      .then(function(result){
        //developer deleted
      },function(err){
        //developer delete failed
      }) ;

## <a name="createproduct"></a>Create Product

Creates a new API Product in Edge

#### Example

    opts.productName = APIGEE_PRODUCT_NAME
    opts.productDesc = 'description'
    opts.proxies = APIGEE_PROXY_NAME
    opts.environments = 'test' //apigee env
    opts.quota = '1', //quota amount
    opts.quotaInterval = '1' //interval
    opts.quotaTimeUnit = 'minute' //timeunit

    sdk.createProduct(opts)
      .then(function(result){
        //product created
      },function(err){
        //product creation failed
      }) ;

## <a name="deleteproduct"></a>Delete Product

Delete API Product in Edge

#### Example
    opts.productName = APIGEE_PRODUCT_NAME

    sdk.deleteProduct(opts)
      .then(function(result){
        //delete success
      },function(err){
        //delete failed
      }) ;

## <a name="createapp"></a>Create App

Create App in Edge

#### Example

      opts.name = APP_NAME
      opts.apiproducts = APIGEE_PRODUCT_NAME
      opts.email = DEVELOPER_EMAIL

      sdk.createApp(opts)
      .then(function(result){
        //create app done
      },function(err){
        //create app failed
      }) ;

## <a name="deleteapp"></a>Delete App

Delete App in Edge

#### Example

      opts.email = DEVELOPER_EMAIL
      opts.name = APP_NAME

      sdk.deleteApp(opts)
      .then(function(result){
        //delete app success
      },function(err){
        //delete app failed
      }) ;

## <a name="createappkey"></a>Create App Key

Create App Key in Edge

#### Example

    opts.key = APP_KEY;
    opts.secret = APP_SECRET;
    opts.developerId = DEVELOPER_EMAIL;
    opts.appName = APP_NAME;
    opts.apiProducts = PRODUCT_NAME;
    
    sdk.createAppKey(opts)
    .then(function(result){
    //create key/secret success
    },function(err){
    //create key/secret failed
    }) ;

## <a name="createcache"></a>Create Cache

Create Cache in Edge

#### Example
    opts.cache = CACHE_RESOURCE_NAME;
    sdk.createcache(opts)
    .then(function(result){
        //cache create success
      },function(err){
        //cache create failed
      }) ;

## <a name="deletecache"></a>Delete Cache

Delete Cache in Edge

#### Example
    opts.cache = CACHE_RESOURCE_NAME;
    sdk.deletecache(opts)
    .then(function(result){
        //delete create success
      },function(err){
        //delete create failed
      }) ;

# <a name="original"></a>Original Tool

This module replaces the original "apigeetool," which was written in Python.
It is also called "apigeetool" and resides here:

https://github.com/apigee/api-platform-tools

# <a name="contrib"></a>Contribution

To run remotetests, provide your edge creds, org, env details in `remotetest/testconfig.js` similar to 'remotetest/testconfig-sample.js'
