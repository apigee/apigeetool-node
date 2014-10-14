# apigeetool

This is a tool for deploying API proxies and Node.js applications to the Apigee Edge platform. The tool also lets you list and undeploy API proxies.

* [Installation](#installation)
* [What you need to know about apigeetool](#whatyouneed)
* [Command reference and examples](#reference)
* [Original tool](#original)

# <a name="installation"></a>Installation

`apigeetool` is a Node.js module and you can install it using npm:

`npm install -g apigeetool`

> NOTE: The `-g` option places the apigeetool command in your PATH. On *nix-based machines, `sudo` may be required with the `-g` option. If you do not use `-g`, then you need to add the apigeetool command to your PATH manually. Typically, the `-g` option places modules in: `/usr/local/lib/node_modules/apigee-127` on *nix-based machines.

# <a name="whatyouneed"></a>What you need to know about apigeetool

You must have an account on Apigee Edge to perform any `apigeetool` functions. These functions include:

* deploying an API proxy to Edge, 
* undeploying an API proxy from Edge, 
* deploying Node.js apps to Edge, and 
* listing deployed API proxies on Edge.

You need to be familiar with basic concepts and features of Apigee Edge such as API proxies, organizations, and environments. 

For more information, refer to the [Apigee Edge docs](http://apigee.com/docs/). 

# <a name="reference"></a>Command reference and examples

* [deploynodeapp](#deploynodeapp)
* [deployproxy](#deployproxy)
* [undeploy](#undeploy)
* [listdeployments](#listdeployments)

## <a name="deploynodeapp"></a>deploynodeapp

Deploys a Node.js app to Apigee Edge as an API proxy. With your Node.js app deployed to Edge, you can take advantage of Edge features like security, quotas, caching, analytics, trace tool, and more. 

#### Examples

Deploys a Node.js app to Apigee Edge. 

    apigeetool deploynodeapp -u sdoe@apigee.com -p password -o sdoe -e test -n 'Test Node App 2' -d . -m app.js -b /node2

Deploys a Node.js app to both the default (HTTP) and secure (HTTPS) virtual hosts. 

    apigeetool deploynodeapp -u sdoe@apigee.com -p password -o sdoe -e test -n 'Test Node App 2' -d . -m app.js -b /node2 -v default,secure


#### Required parameters

`--username  -u`  
(required) Your Apigee account username.

`--password  -p`  
(required) Your Apigee account password.

`--organization  -o`  
(required) The name of the organization to deploy to.

`--api   -n`  
(required) The name of the API proxy. The name of the API proxy must be unique within an organization. The characters you are allowed to use in the name are restricted to the following: `A-Z0-9._\-$ %`.

`--environment   -e`  
(required) The name of the environment to deploy to.  

`--directory -d`  
(required) The path to the root directory of the API proxy on your local system. 

`--main  -m`  
(required) The Node.js file you want to be the main file. 

#### Optional parameters

`--help  -h`  
(optional) Displays help on this command.

`--baseuri   -L`  
(optional) The base URI for you organization on Apigee Edge. The default is the base URI for Apigee cloud deployments is `api.enterprise.apigee.com`. For on-premise deployments, the base URL may be different. 

`--debug -D`  
(optional) Prints additional information about the deployment, including router and message processor IDs. 

`--verbose   -V`  
(optional) Prints additional information as the deployment proceeds.

`--json  -j`  
(optional) Formats the command's response as a JSON object.

`--virtualhosts  -v`  
(optional) A comma-separated list of virtual hosts that the deployed app will use. The two most common options are `default` and `secure`. The `default` option is always HTTP and `secure` is always HTTPS. By default, `apigeetool deploynodeapp` uses only the `default` virtual host. Note that on the Apigee Edge cloud platform, all new proxies are assigned two virtual hosts: `default` and `secure`. If you want your deployed Node.js app to use both HTTP and HTTPS, specify `-v default,secure`. 

`--base-path -b`  
(optional) The base path of the API proxy. For example, for this API proxy, the base path is `/example-proxy`: `http://myorg-test.apigee.net/example-proxy/resource1`. 

`--import-only   -i`  
(optional) Imports the API proxy to Apigee Edge but does not deploy it. 

`--resolve-modules   -R`  
(optional) If the API proxy includes Node.js modules (e.g., in a `node_modules` directory), this option updates them on Apigee Edge without uploading them from your system. Basically, it's like running npm on Apigee Edge in the root directory of the API proxy bundle.  

`--upload-modules    -U`  
(optional) If specified, uploads Node.js modules from your system to Apigee Edge rather than resolving the modules directly on Apigee Edge.


## <a name="deployproxy"></a>deployproxy

Deploys an API proxy to Apigee Edge. If the proxy is currently deployed, it will be undeployed first, and the newly deployed proxy's revision number is incremented.

#### Example

Deploys an API proxy called example-proxy to Apigee Edge. Per the `-d` flag, the command is executed in the root directory of the proxy bundle.

    apigeetool deployproxy  -u sdoe@example.com -p password -o sdoe  -e test -n example-proxy -d .

#### Required parameters

`--username  -u` 
(required) Your Apigee account username.

`--password  -p`  
(required) Your Apigee account password.

`--organization  -o`  
(required) The name of the organization to deploy to.

`--api   -n`  
(required) The name of the API proxy. Note: The name of the API proxy must be unique within an organization. The characters you are allowed to use in the name are restricted to the following: `A-Z0-9._\-$ %`.

`--environment   -e`  
(required) The name of the environment to deploy to.  

`--directory -d`  
(required) The path to the root directory of the API proxy on your local system. 

#### Optional parameters

`--help  -h`  
(optional) Displays help on this command.

`--baseuri   -L`  
(optional) The base URL for you organization on Apigee Edge. The default is the base URL for Apigee cloud deployments is `api.enterprise.apigee.com`. For on premise deployments, the base URL may be different. 

`--debug -D`  
(optional) Prints additional information about the deployment, including router and message processor IDs. 

`--verbose   -V`  
(optional) Prints additional information as the deployment proceeds.

`--json  -j`  
(optional) Formats the command's response as a JSON object.

`--base-path -b`  
(optional) The base path of the API proxy. For example, for this API proxy, the base path is /example-proxy: http://myorg-test.apigee.net/example-proxy/resource1. 

`--import-only   -i`  
(optional) Imports the API proxy to Apigee Edge but does not deploy it. 

`--resolve-modules   -R`  
(optional) If the API proxy includes Node.js modules (e.g., in a `node_modules` directory), this option updates them on Apigee Edge without uploading them from your system. Basically, it's like running npm on Apigee Edge in the root directory of the API proxy bundle.  

`--upload-modules    -U`  
(optional) If specified, uploads Node.js modules from your system to Apigee Edge. 


## <a name="undeploy"></a>undeploy

Undeploys a named API proxy deployed on Apigee Edge.

#### Example

Undeploy the proxy named "example-proxy".

    apigeetool undeploy -u sdoe@example.com -p password -o sdoe  -n example-proxy -e test -D

#### Required parameters

`--username  -u`  
(required) Your Apigee account username.

`--password  -p`  
(required) Your Apigee account password.

`--api   -n`  
(required) The name of the API proxy to undeploy.

`--environment   -e`  
(required) The environment on Apigee Edge where the API proxy is currently deployed. 

`--organization  -o` 
(required) The name of the organization where the API proxy is deployed.

#### Optional parameters

`--help  -h`  
(optional) Displays help on this command.

`--baseuri   -L`  
(optional) The base URL for you organization on Apigee Edge. The default is the base URL for Apigee cloud deployments is `api.enterprise.apigee.com`. For on premise deployments, the base URL may be different. 

`--debug -D`  
(optional) Prints additional information about the undeployment, including router and message processor IDs. 

`--verbose   -V`  
(optional) Prints additional information as the undeploy proceeds.  

`--json  -j`  
(optional) Returns results in JSON format.

`--revision  -r`  
(optional) Specify the revision number of the API proxy to undeploy. 


## <a name="listdeployments"></a>listdeployments

Lists the API proxies deployed on Apigee Edge for the specified organization. Lets you filter the result by API proxy name or environment.

#### Examples

List all API proxies in an organization:

    `$ apigeetool listdeployments -u sdoe@example.com -p password -o sdoe -e test`

List API proxies named "example-proxy":

    $ apigeetool listdeployments -u sdoe@example.com -p password -o sdoe -n example-proxy

#### Required parameters

`--username  -u`     
(required) Your Apigee account username.

`--password  -p`      
(required) Your Apigee account password. 

`--organization  -o`  
(required) The name of the organization you wish to query.

#### Required, mutually exclusive parameters

`--api   -n`          
(You must specify either `api` or `environment` in this command) The name of the API proxy to list.

`--environment   -e`  
(You must specify either `api` or `environment` in this command) The environment for which you want to list deployments. When `-e` is specified, the command lists all deployed proxies in the environment.

#### Optional parameters

`--baseuri   -L`  
(optional) The base URL for you organization on Apigee Edge. The default is the base URL for Apigee cloud deployments is `api.enterprise.apigee.com`. For on premise deployments, the base URL may be different.

`--debug -D`          
(optional) Returns additional information about the API proxy deployments including router and message processor IDs. 

`--verbose   -V`      
(optional) Prints additional information about the operation.  

`--json  -j`          
(optional) Returns the result in JSON format.

`--revision  -r`      
(optional) Filters the list by the specified revision number.  

`--long  -l`          
(optional) Returns additional information about the API proxy.


# <a name="original"></a>Original Tool

This module replaces the original "apigeetool," which was written in Python.
It is also called "apigeetool" and resides here:

https://github.com/apigee/api-platform-tools

