/* jshint node: true  */
'use strict';

var async = require('async');
var util = require('util');
var readline = require('readline');
var tty = require('tty');

/*
 * Validate the options as if they came from a command line.
 * This will not fill in missing options -- "validate" may be used
 * to do that later.
 */
 module.exports.getopts = function(argv, start, descriptor) {
   var opts = {};
   for (var i = start; i < argv.length; i++) {
     var longArg = /^--(.+)/.exec(argv[i]);
     if (longArg) {
       var longArgName = longArg[1];
       var ld = descriptor[longArgName];
       if (ld) {
         if (ld.toggle) {
           opts[longArgName] = true;
         } else if (i < (argv.length - 1)) {
           i++;
           opts[longArgName] = argv[i];
         } else {
           badArg(argv[i]);
         }
       }

     } else {
       var shortArg = /^-([A-Za-z])/.exec(argv[i]);
       if (shortArg) {
         var shortArgName = shortArg[1];
         var longName;
         var des;
         for (var sd in descriptor) {
          des = descriptor[sd];
           if (des.shortOption === shortArgName) {
             longName = sd;
             break;
           }
         }

         if (longName) {
          if  (des.toggle) {
            opts[longName] = true;
          } else if (i < (argv.length - 1)) {
            i++;
            opts[longName] = argv[i];
          } else {
            badArg(argv[i]);
          }
        }
       } else {
         badArg(argv[i]);
       }
     }
   }
   return opts;
 };

 function badArg(arg) {
  throw new Error(util.format('Unknown argument %s', arg));
 }

/*
 * Given an "options" object, validate it against "descriptor."
 * Each property in "descriptor" is the name of an option, and has
 * the following possible fields:
 *   required (boolean) error if the option is not present
 *   secure (boolean) error if we must prompt in a secure way
 */
module.exports.validate = function(opts, descriptor, cb) {
  var console;
  if (opts.interactive) {
    console = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }
  async.eachSeries(Object.getOwnPropertyNames(descriptor), function(item, done) {
    checkProperty(opts, descriptor, item, console, done);
  }, function(err) {
    cb(err, opts);
  });
};

function checkProperty(opts, descriptor, propName, console, done) {
  var desc = descriptor[propName];
  if (desc.required && !opts[propName]) {
    if (opts.interactive) {
      var pn = (desc.name ? desc.name : propName);
      prompt(pn, desc.secure, console, function(err, val) {
        if (err) {
          done(err);
        } else {
          opts[propName] = val;
          done();
        }
      });
    } else {
      done(new Error(util.format('Missing required option "%s"', propName)));
    }
  } else {
    done();
  }
}

function prompt(name, secure, console, cb) {
  console.question(util.format('%s: ', name), function(line) {
    cb(undefined, line);
  });
}

/*
 * Produce some "help" text based on the descriptor.
 */
module.exports.getHelp = function(descriptor) {
  var h = '';
  for (var longArg in descriptor) {
    var des = descriptor[longArg];
    h += util.format('--%s\t%s\t%s\n',
                     longArg,
                     (des.shortOption ? '-' + des.shortOption : ''),
                     (des.required ? '(required)': '(optional)'));
  }
  return h;
};
