/*
 * This configures the test in this directory to use a remote instance
 * of Apigee. Copy it to "testconfig.js" and edit it for your environment.
 */
module.exports = {
  // Your Apigee organization name
  organization: 'amer-demo1',
  // The environment to deploy to for testing -- 'test' is good
  environment: 'test',
  // The user name to authenticate with for the Apigee management API
  username: 'mukundha@apigee.com',
  // The password for that user name
  password: 'Apigee@123'
  // Uncomment for the management API URI of your local Apigee environment
  // Leave commented to test using the Apigee cloud.
  //baseuri: 'http://mgmt:8080'
};
