/* jshint node: true  */
"use strict";

const util = require("util"),
  defaults = require("../defaults"),
  options = require("../options");

const descriptor = defaults.defaultDescriptor({
  email: {
    name: "Developer Email",
    required: true
  },
  name: {
    name: "App Name",
    required: true
  }
});

module.exports.descriptor = descriptor;

module.exports.run = function (opts, cb) {
  options.validateSync(opts, descriptor);
  if (opts.debug) {
    console.log("deleteApp: %j", opts);
  }
  const request = defaults.defaultRequest(opts);
  deleteApp(opts, request, function (err, results) {
    if (err) {
      cb(err);
    } else {
      if (opts.debug) {
        console.log("results: %j", results);
      }
      cb(undefined, results);
    }
  });
};

function deleteApp(opts, request, done) {
  let uri = util.format(
    "%s/v1/o/%s/developers/%s/apps/%s",
    opts.baseuri,
    opts.organization,
    opts.email,
    opts.name
  );

  request(
    {
      uri,
      method: "DELETE",
      json: true
    },
    function (err, res, jsonBody) {
      if (err) {
        if (opts.debug) {
          console.log("Error occured %s", err);
        }
        done(err);
      } else if (res.statusCode === 200) {
        if (opts.verbose) {
          console.log("Delete successful");
        }
        if (opts.debug) {
          console.log("%s", jsonBody);
        }
        done(undefined, jsonBody);
      } else {
        if (opts.verbose) {
          console.error("Delete App result: %j", jsonBody);
        }
        const errMsg =
          jsonBody && jsonBody.message
            ? jsonBody.message
            : util.format(
                "Delete App failed with status code %d",
                res.statusCode
              );

        done(new Error(errMsg));
      }
    }
  );
}
