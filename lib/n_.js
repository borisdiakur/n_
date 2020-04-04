var osHomedir = require('os').homedir()
var path = require('path')
var replHistory = require('repl-story')
var c = require('chalk')

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
  .option('prompt-symbol', {
    description: 'Prompt symbol for the repl',
    string: true,
    default: '>'
  })
  .option('prompt-name', {
    description: 'Base name for the prompt',
    string: true,
    default: 'n_'
  })
  .env('_N')

// store method reference in case it is overwritten later
var setDescriptors = Object.defineProperties

function injectLodashIntoRepl (server, lodashes, promptConfig) {
  var currentFlavor = lodashes.initial
  var currentLodash = lodashes[currentFlavor]

  const setLodash = flavor => repl => {
    currentFlavor = typeof flavor === 'string' ? flavor : flavor()
    repl.log(`Setting lodash _ to ${currentFlavor} flavor!`)
    currentLodash = lodashes[currentFlavor]
    repl.setPrompt(promptConfig.makePrompt(currentFlavor))
  }

  const commandHelps = {
    fp: 'set _ to lodash/fp',
    vanilla: "set _ to 'vanilla' lodash",
    swap: 'change flavor of _ (from vanilla to fp or the reverse)',
    reset: 'restore original lodash version used',
    current: 'print current flavor of lodash in use'
  }
  const lodashSubCommands = {
    fp: setLodash('fp'),
    vanilla: setLodash('vanilla'),
    reset: setLodash(lodashes.initial),
    swap: setLodash(() => currentFlavor === 'fp' ? 'vanilla' : 'fp'),
    current: repl => repl.log(`Current lodash flavor is ${currentFlavor}`),
    help: repl => repl.log([
      `${c.bold.green('.lodash')} enable you to configure the ${c.bold('_')} lodash instance of n_ repl, here are the available sub-commands:`,
      ...Object.entries(commandHelps).map(([command, help]) => `- ${c.bold.green(command)}: ${help.replace('_', c.bold('_'))}`)
    ].join('\n'))
  }

  const clear = typeof server.clearBufferedCommand === 'function' ? server => server.clearBufferedCommand() : server => { server.bufferedCommand = '' }
  server.defineCommand('lodash', {
    help: 'Configure lodash utils, commands: help, current, swap, fp, vanilla, reset',
    action: function (input) {
      clear(this)
      if (!input) {
        this.log('Please provide a subcommand to  .lodash')
        lodashSubCommands.help(this)
      } else {
        var subcommand = input.split(' ')[0]
        var handler = lodashSubCommands[subcommand]
        if (!handler) this.log(`there is no '${subcommand}' available, see 'help'`)
        else handler(this)
      }
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

  const promptConfig = {
    symbol: args.promptSymbol,
    name: args.promptName,
    makePrompt (flavor) {
      return `${c.bold.blue(this.name)}${flavor ? ':/' + c.bold.cyan(flavor) : ''} ${c.bold.red(this.symbol)} `
    }
  }

  var server = repl.start(Object.assign({
    prompt: promptConfig.makePrompt(),
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

  injectLodashIntoRepl(server, { vanilla: lodashVanilla, fp: lodashFp, initial: args.fp ? 'fp' : 'vanilla' }, promptConfig)

  return server
}

module.exports = main
/* istanbul ignore next */
if (!module.parent) {
  main(process.argv.slice(2))
}
