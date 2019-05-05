var osHomedir = require('os').homedir()
var path = require('path')
var replHistory = require('repl.history')

// store method reference in case it is overwritten later
var setDescriptor = Object.defineProperty

// create REPL server instance
var repl = require('repl')
var server = repl.start({
  prompt: 'n_ > ',
  // allow strict mode via command line argument
  replMode: process.argv.indexOf('--use_strict') !== -1 ? repl.REPL_MODE_STRICT : repl.REPL_MODE_MAGIC
})

// save repl history
replHistory(server, path.join(osHomedir, '.n_repl_history'))

// create new pristine `lodash` instance
var _ = require('lodash').runInContext(server.context)

var lodashToInject = process.argv.indexOf('--fp') === -1 ? _ : require(path.join('lodash', 'fp')).runInContext(server.context)

// state vars
var prevVal = lodashToInject
var currVal = lodashToInject

// inject lodash into the context
setDescriptor(server.context, '_', {
  configurable: true,
  enumerable: false,
  get: function () {
    return currVal
  },
  set: function (val) {
    prevVal = currVal
    currVal = val
  }
})

var events = server._events
events.line = _.wrap(events.line, function (line, cmd) {
  line[0](cmd) // actual command execution
  line[1](cmd) // history persistance
  currVal = prevVal
})

module.exports = server
