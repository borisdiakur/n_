var osHomedir = require('os').homedir()
var path = require('path')
var replHistory = require('repl-story')

var argsSpec = require('yargs')
  .option('fp', {
    description: 'Use fp flavor of lodash',
    default: false,
    boolean: true
  })
  .option('use_strict', {
    description: 'Activate strict mode',
    alias: ['use-strict', 's'],
    default: false,
    boolean: true
  })
  .option('filename', {
    description: 'Use a custom history filename',
    alias: ['f', 'history', 'history-file'],
    string: true,
    default: path.join(osHomedir, '.n_repl_history')
  })
  .option('prompt', {
    description: 'Use a custom prompt for the repl',
    alias: 'p',
    string: true,
    default: 'n_ > '
  })

// store method reference in case it is overwritten later
var setDescriptor = Object.defineProperty

// create REPL server instance
var repl = require('repl')

function main (argv, replExtraArgs = {}) {
  var args = argsSpec.parse(argv || [])
  var server = repl.start(Object.assign({
    prompt: args.prompt,
    // allow strict mode via command line argument
    replMode: args.useStrict ? repl.REPL_MODE_STRICT : repl.REPL_MODE_SLOPPY
  }, replExtraArgs))

  // save repl history
  replHistory({ repl: server, filename: args.filename })

  // create new pristine `lodash` instance
  var _ = require('lodash').runInContext(server.context)

  var lodashToInject = args.fp ? require('lodash/fp').runInContext(server.context) : _

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

  return server
}

module.exports = main
if (!module.parent) {
  main(process.argv.slice(2))
}
