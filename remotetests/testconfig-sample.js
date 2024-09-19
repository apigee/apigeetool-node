/*
 * This configures the test in this directory to use a remote instance
 * of Apigee. Copy it to "testconfig.js" and edit it for your environment.
 */
module.exports = {
  // Your Apigee organization name
  organization: "<org>",
  // The environment to deploy to for testing -- 'test' is good
  environment: "<env>",

  // Authentication options, choose (uncomment) ONE:
  // A. an active OAuth token
  token: "eyJ...",

  // B. username and password
  // username: "<edgeuser>",
  // password: "<pass>",

  // C. use .netrc to specify username and password
  // netrc: true

  debug: false,
  verbose: false,

  // This USER must exist in the Apigee org before running tests. To test roles etc.
  useremail: "someone+tester@google.com"

  // not sure we need the password.
  // userpassword: 'Supersecret123'

  // Uncomment for the management API URI of your local Apigee environment
  // Leave commented to test using the Apigee cloud.
  //baseuri: 'http://mgmt:8080'
};
