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
    alias: ['f', 'history', 'history-file', 'history-path'],
    string: true,
    default: path.join(osHomedir, '.n_repl_history')
  })
  .option('prompt', {
    description: 'Use a custom prompt for the repl',
    alias: 'p',
    string: true,
    default: 'n_ > '
  })
  .env('_N')

// store method reference in case it is overwritten later
var setDescriptors = Object.defineProperties

function injectLodashIntoRepl (server, lodashes) {
  var currentFlavor = lodashes.initial
  var currentLodash = lodashes[currentFlavor]

  const setLodash = flavor => repl => {
    currentFlavor = typeof flavor === 'string' ? flavor : flavor()
    repl.log(`Setting lodash _ to ${currentFlavor} flavor!`)
    currentLodash = lodashes[currentFlavor]
  }

  const lodashSubCommands = {
    fp: setLodash('fp'),
    vanilla: setLodash('vanilla'),
    reset: setLodash(lodashes.initial),
    swap: setLodash(() => currentFlavor === 'fp' ? 'vanilla' : 'fp'),
    current: repl => repl.log(`Current lodash flavor is ${currentFlavor}`),
    help: repl => repl.log([
      '.lodash enable you to configure the _ lodash instance of n_ repl',
      '- fp: set _ to lodash/fp',
      "- vanilla: set _ to 'vanilla' lodash",
      '- swap: change flavor of _ (from vanilla to fp or the reverse)',
      '- reset: restore original lodash version used',
      '- current: print current flavor of lodash in use'
    ].join('\n'))
  }

  const clear = typeof server.clearBufferedCommand === 'function' ? server => server.clearBufferedCommand() : server => { server.bufferedCommand = '' }
  server.defineCommand('lodash', {
    help: 'Configure lodash utils, commands: help, current, swap, fp, vanilla, reset',
    action: function (input) {
      clear(this)

      var subcommand = input.split(' ')[0]
      var handler = lodashSubCommands[subcommand]
      if (!handler) this.log(`there is no '${subcommand}' available, see 'help'`)
      else handler(this)
      this.displayPrompt()
    }
  })

  // TODO: see if can change prompt

  // inject lodash into the context
  setDescriptors(server.context, {
    _: {
      configurable: true,
      enumerable: false,
      get: function () {
        return currentLodash
      },
      set: function (val) {
        // noop, value will still retrieved by repl
      }
    },
    __: {
      // Restore the '_' last value under alias '__'
      configurable: true,
      enumerable: false,
      get: function () {
        return server.last
      }
    }
  })
  return server
}

// create REPL server instance
var repl = require('repl')

function main (argv, replExtraArgs) {
  var args = argsSpec.parse(argv)
  var server = repl.start(Object.assign({
    prompt: args.prompt,
    // allow strict mode via command line argument
    replMode: args.useStrict ? repl.REPL_MODE_STRICT : repl.REPL_MODE_SLOPPY
  }, replExtraArgs))

  // attach log method, (introduce to be overridable from outside for the tests)
  server.log = console.log

  // save repl history
  replHistory(server, args.filename)

  // create new pristine `lodash` instance
  var lodashVanilla = require('lodash').runInContext(server.context)
  var lodashFp = require('lodash/fp').runInContext(server.context)

  injectLodashIntoRepl(server, { vanilla: lodashVanilla, fp: lodashFp, initial: args.fp ? 'fp' : 'vanilla' })

  return server
}

module.exports = main
/* istanbul ignore next */
if (!module.parent) {
  main(process.argv.slice(2))
}
