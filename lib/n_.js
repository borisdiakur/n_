const osHomedir = require('os').homedir()
const path = require('path')
const replHistory = require('repl-story')

const CHALK_STYLES = [
  'black',
  'red',
  'green',
  'yellow',
  'blue',
  'magenta',
  'cyan',
  'white',
  'gray',
  'dim',
]

const argsSpec = require('yargs')
  .option('fp', {
    description: 'Use fp flavor of lodash',
    default: false,
    boolean: true,
  })
  .option('use_strict', {
    description: 'Activate strict mode',
    alias: ['use-strict', 's'],
    default: false,
    boolean: true,
  })
  .option('history-path', {
    description: 'Use a custom history filename',
    alias: ['history', 'history-file'],
    string: true,
    default: path.join(osHomedir, '.n_repl_history'),
  })
  .option('prompt.symbol', {
    description: 'Prompt symbol for the repl',
    string: true,
    default: '>',
  })
  .option('prompt.color.symbol', {
    description: 'Color for symbol part of prompt',
    default: 'red',
  })
  .option('prompt.color.flavor', {
    description: 'Color for flavor part of prompt',
    default: 'cyan',
  })
  .option('prompt.color.name', {
    description: 'Color for name part of prompt',
    default: 'blue',
  })
  .option('prompt.color.help', {
    description: 'Color for help highlight',
    default: 'green',
  })
  .option('prompt.name', {
    description: 'Base name for the prompt',
    string: true,
    default: 'n_',
  })
  .coerce('prompt', (prompt) => {
    for (const [key, color] of Object.entries(prompt.color)) {
      if (!CHALK_STYLES.includes(color))
        throw new Error(`Unsupported color '${color}' for '${key}' color`)
    }
    return prompt
  })
  .fail((message) => {
    throw new Error(`Invalid provided option: ${message}`)
  })
  .env('_N')

const argsDefaults = argsSpec.parse([])

// store method reference in case it is overwritten later
const setDescriptors = Object.defineProperties

function injectLodashIntoRepl(server, lodashes, promptConfig, c) {
  let currentFlavor = lodashes.initial
  let currentLodash = lodashes[currentFlavor]

  const { help: helpColor, flavor: flavorColor } = promptConfig.color

  const setLodash = (flavor) => (repl) => {
    currentFlavor = typeof flavor === 'string' ? flavor : flavor()
    repl.log(`Setting lodash ${c.bold('_')} to ${c.bold[flavorColor](currentFlavor)} flavor!`)
    currentLodash = lodashes[currentFlavor]
    repl.setPrompt(promptConfig.makePrompt(currentFlavor))
  }

  const commandHelps = {
    fp: 'set _ to lodash/fp',
    vanilla: "set _ to 'vanilla' lodash",
    swap: 'change flavor of _ (from vanilla to fp or the reverse)',
    reset: 'restore original lodash version used',
    current: 'print current flavor of lodash in use',
    version: 'print current version of lodash in use',
  }
  const lodashSubCommands = {
    fp: setLodash('fp'),
    vanilla: setLodash('vanilla'),
    reset: setLodash(lodashes.initial),
    swap: setLodash(() => (currentFlavor === 'fp' ? 'vanilla' : 'fp')),
    current: (repl) => repl.log(`Current lodash flavor is ${c.bold[flavorColor](currentFlavor)}`),
    version: (repl) =>
      repl.log(`Current lodash version is ${c.bold[flavorColor](currentLodash.VERSION)}`),
    help: (repl) =>
      repl.log(
        [
          `${c.bold[helpColor]('.lodash')} enables you to configure the ${c.bold(
            '_',
          )} lodash instance of n_ repl, here are the available sub-commands:`,
          ...Object.entries(commandHelps).map(
            ([command, help]) =>
              `- ${c.bold[helpColor](command)}: ${help.replace('_', c.bold('_'))}`,
          ),
        ].join('\n'),
      ),
  }

  const clear =
    typeof server.clearBufferedCommand === 'function'
      ? (server) => server.clearBufferedCommand()
      : (server) => {
          server.bufferedCommand = ''
        }
  server.defineCommand('lodash', {
    help: 'Configure lodash utils, commands: help, current, swap, fp, vanilla, reset, version',
    action: function (input) {
      clear(this)
      if (!input) {
        this.log('Please provide a sub-command for .lodash')
        lodashSubCommands.help(this)
      } else {
        const subcommand = input.split(' ')[0]
        const handler = lodashSubCommands[subcommand]
        if (!handler)
          this.log(
            `there is no '${c.bold.red(
              subcommand,
            )}' sub-command, see available ones with '.lodash ${c.bold[helpColor]('help')}'`,
          )
        else handler(this)
      }
      this.displayPrompt()
    },
  })

  // inject lodash into the context
  setDescriptors(server.context, {
    _: {
      configurable: true,
      enumerable: false,
      get: function () {
        return currentLodash
      },
      set: function () {
        // noop, value will still be retrieved by repl
      },
    },
    __: {
      // Restore the '_' last value under alias '__'
      configurable: true,
      enumerable: false,
      get: function () {
        return server.last
      },
    },
  })
  return server
}

function wrapRepl(args, c) {
  const completeArgs = Object.assign({}, argsDefaults, args)
  const promptConfig = {
    ...completeArgs.prompt,
    makePrompt(flavor) {
      return `${c.bold[this.color.name](this.name)}${
        flavor ? `:/${c.bold[this.color.flavor](flavor)}` : ''
      } ${c.bold[this.color.symbol](this.symbol)} `
    },
  }
  const initialPrompt = promptConfig.makePrompt()
  const customReplServer = completeArgs.replServer instanceof repl.REPLServer

  const server = customReplServer
    ? completeArgs.replServer
    : repl.start({
        prompt: initialPrompt,
        // allow strict mode via command line argument
        replMode: completeArgs.useStrict ? repl.REPL_MODE_STRICT : repl.REPL_MODE_SLOPPY,
      })
  if (completeArgs.replServer) server.setPrompt(initialPrompt)

  // attach log method, (introduce to be overridable from outside for the tests)
  server.log = console.log

  // save repl history
  replHistory(server, completeArgs.historyPath)

  // create new pristine `lodash` instance
  const ld = require('lodash')
  const lodashVanilla = ld.runInContext.apply(global, server.context)
  const lodashFunctional = require('lodash/fp').runInContext.apply(global, server.context)

  injectLodashIntoRepl(
    server,
    {
      vanilla: lodashVanilla,
      fp: lodashFunctional,
      initial: args.fp ? 'fp' : 'vanilla',
    },
    promptConfig,
    c,
  )

  return server
}

// create REPL server instance
const repl = require('repl')

async function main(argv) {
  const c = (await import('chalk')).default
  try {
    const args = argsSpec.parse(argv)
    wrapRepl(args, c)
  } catch (err) {
    console.error(c.bold.red(err.message))
    process.exit(1)
  }
}

module.exports = { main, wrapRepl }

// istanbul ignore next
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
if (!module.parent) {
  main(process.argv.slice(2))
}
