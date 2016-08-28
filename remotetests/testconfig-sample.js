/*
 * This configures the test in this directory to use a remote instance
 * of Apigee. Copy it to "testconfig.js" and edit it for your environment.
 */
module.exports = {
  // Your Apigee organization name
  organization: 'testorg',
  // The environment to deploy to for testing -- 'test' is good
  environment: 'test',
  // The user name to authenticate with for the Apigee management API
  username: 'foo@example.com',
  // The password for that user name
  password: 'aaa'
  // Uncomment for the management API URI of your local Apigee environment
  // Leave commented to test using the Apigee cloud.
  //baseuri: 'http://mgmt:8080'
  // Uncomment if you want to use the Apigee access token instead of your username and password
  //token: 'your-apigee-access-token'
};
