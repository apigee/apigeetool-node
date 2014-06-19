/* jshint node: true  */
'use strict';

var main = require('./main');
var options = require('./options');

if (process.argv.length < 3) {
  console.error('Usage: apigeetool <command>');
  process.exit(2);
}

var command = process.argv[2];
var commandModule;

if (command === 'listdeployments') {
  commandModule = require('./commands/listdeployments.js');
} else {
  console.error('Invalid command "%s"', command);
  process.exit(3);
}

var opts;
try {
  opts = options.getopts(process.argv, 3, commandModule.descriptor);
} catch (e) {
  printUsage(e);
  process.exit(4);
}

options.validate(opts, commandModule.descriptor, function(err) {
  if (err) {
    printUsage(err);
    process.exit(5);
  }
  runCommand();
});

function printUsage(err) {
  console.error('Invalid arguments: %s', err);
  console.log('Usage:');
  console.log(options.getHelp(commandModule.descriptor));
}

function runCommand() {
  commandModule.run(opts, function(err, result) {
    if (err) {
      console.error('Error: %s', err);
      process.exit(6);
    }
    console.log(JSON.stringify(result));
  });
}
