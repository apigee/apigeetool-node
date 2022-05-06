const options = require('./options');
const fns = require('./fns');

var DefaultDefaults = {};

function runCommand(cmd, opts, cb) {
  options.validate(opts, cmd.descriptor, e => {
    if (e) {
      cb(e);
      return;
    }
    cmd.run(opts, cb);
  });
}

function ApigeeTool(defaults) {
  this.defaults = (defaults ? defaults : DefaultDefaults);
}

ApigeeTool.getPromiseSDK = () => require('./promisesdk');
ApigeeTool.defaults = (newDefaults) => new ApigeeTool(newDefaults);

fns.forEach(fnName => {
  ApigeeTool[fnName] = (opts, cb) => runCommand(require(`./commands/${fnName}`), opts, cb);
});

module.exports = ApigeeTool;
