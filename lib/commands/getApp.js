const util = require("util"),
  defaults = require("../defaults"),
  options = require("../options");

const descriptor = defaults.defaultDescriptor({
  app: {
    name: "app",
    shortOption: "a",
    required: true,
    prompt: true
  }
});

module.exports.descriptor = descriptor;

module.exports.format = function (r) {
  return r.join("\n");
};

module.exports.run = function (opts, cb) {
  options.validateSync(opts, descriptor);
  if (opts.debug) {
    console.log("listApps: %j", opts);
  }

  let uri = util.format(
    "%s/v1/o/%s/apps/%s",
    opts.baseuri,
    opts.organization,
    opts.app
  );
  let request = defaults.defaultRequest(opts);
  if (opts.debug) {
    console.log('Going to invoke "%s"', uri);
  }
  request.get(uri, function (err, req, body) {
    if (err) {
      cb(err);
    } else {
      if (req.statusCode === 200) {
        if (opts.debug) {
          console.log("App: %j", body);
        }
        if (opts.debug) {
          console.log("All done");
        }
        cb(undefined, body);
      } else {
        cb(new Error(util.format("HTTP error %d", req.statusCode)));
      }
    }
  });
};
