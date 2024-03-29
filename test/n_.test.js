const test = require('ava').default
const fs = require('fs')
const path = require('path')
const repl = require('repl')
const stream = require('stream')
const _ = require('lodash/fp')
const { wrapRepl } = require('../lib/n_')

const TMP_FOLDER = path.join(
  __dirname,
  '..',
  'tmp',
  `histories--${new Date().toISOString().replace(/T.*$/, '')}--${process.pid}`,
)

async function getNREPL(args) {
  const c = (await import('chalk')).default

  const logs = []
  const log = (line) => logs.push(line)

  const capturedOutput = []
  const exposedInput = new stream.PassThrough()
  const instrumentedRepl = repl.start({
    output: new stream.Writable({
      write(chunck, encoding, cb) {
        capturedOutput.push(chunck)
        cb()
      },
    }),
    input: exposedInput, // need to be explicit if setting put. (later could feed directly input)
    // note: using process.input cause MaxListenersExceededWarning to appear in test
  })
  const n_ = wrapRepl(
    _.defaults(
      {
        replServer: instrumentedRepl,
        historyPath: path.join(TMP_FOLDER, `.n_history-${+Date.now()}`),
      },
      args,
    ),
    c,
  )
  n_.log = log
  n_.logs = logs

  // helper to retrieve line to emit direct event
  n_.sendLine = function (line) {
    _.over(n_._events.line)(line)
    return n_ // for chainable calls
  }
  n_.exposedInput = exposedInput
  n_.waitClose = function (delay = 0) {
    return new Promise((resolve) => {
      n_.on('end-of-story', resolve)
      setTimeout(() => n_.close(), delay)
    })
  }

  Object.defineProperty(n_, 'capturedOutput', {
    get() {
      return capturedOutput.join('\n')
    },
  })
  // TODO: later could use capturedOutput to add extract test (after cleaning prompts and else)
  return n_
}

test.before(() => {
  for (const folder of [path.dirname(TMP_FOLDER), TMP_FOLDER]) {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder)
    }
  }
})

test('should evaluate multiline input', async (t) => {
  const n_ = await getNREPL()
  n_.sendLine('const users = [')
  n_.sendLine('  { "user": "fred",   "age": 48 },')
  n_.sendLine('  { "user": "barney", "age": 36 },')
  n_.sendLine('  { "user": "fred",   "age": 42 },')
  n_.sendLine('  { "user": "barney", "age": 34 }')
  n_.sendLine(']')
  t.is(n_.last, undefined)
  n_.sendLine('_.sortBy(users, function(o) { return o.user })')
  await n_.waitClose()
  t.is(n_.last[0].user, 'barney')
  t.is(n_.last[0].age, 36)
  t.is(n_.last[1].user, 'barney')
  t.is(n_.last[1].age, 34)
  t.is(n_.last[2].user, 'fred')
  t.is(n_.last[2].age, 48)
  t.is(n_.last[3].user, 'fred')
  t.is(n_.last[3].age, 42)
})

test('should evaluate simple input', async (t) => {
  const n_ = await getNREPL()
  n_.sendLine('1+2')
  await n_.waitClose()
  t.is(n_.last, 3)
})

test('should evaluate multiple lodash method calls', async (t) => {
  const n_ = await getNREPL()
  n_.sendLine('_.compact([1, 2, false, 4])')
  t.deepEqual(n_.last, [1, 2, 4])
  n_.sendLine('_.compact([1, false, 3, 4])')
  await n_.waitClose()
  t.deepEqual(n_.last, [1, 3, 4])
})

test('should evaluate with built in libs', async (t) => {
  const n_ = await getNREPL()
  n_.sendLine('util.isArray(_.drop([1, 2, 3]))')
  t.is(n_.last, true)
  n_.sendLine('_.name')
  await n_.waitClose()
  t.is(n_.last, 'lodash')
})

test('should prevent overwriting of special variable _ and output result', async (t) => {
  const n_ = await getNREPL()
  n_.sendLine('_="foobar"')
  t.is(n_.last, 'foobar')
  n_.sendLine('_.name')
  await n_.waitClose()
  t.is(n_.last, 'lodash')
})

test('should expose last value under __ (alias of original special variable _)', async (t) => {
  const n_ = await getNREPL()
  n_.sendLine('"1"  + 2')
  t.is(n_.last, '12')
  n_.sendLine('40 + __')
  await n_.waitClose()
  t.is(n_.last, '4012')
})

const helpText = `.lodash enables you to configure the _ lodash instance of n_ repl, here are the available sub-commands:
- fp: set _ to lodash/fp
- vanilla: set _ to 'vanilla' lodash
- swap: change flavor of _ (from vanilla to fp or the reverse)
- reset: restore original lodash version used
- current: print current flavor of lodash in use
- version: print current version of lodash in use`

test('should expose .lodash command', async (t) => {
  const n_ = await getNREPL()

  const stripAnsi = (await import('strip-ansi')).default

  n_.sendLine('const obj = {a: 2}')
  function ensureVanilla(repl) {
    repl.sendLine("_.get(obj, 'a')")
    t.is(repl.last, 2, 'lodash does not seems to be vanilla')
  }
  function ensureFp(repl) {
    repl.sendLine("_.get('a', obj)")
    t.is(repl.last, 2, 'lodash is not fp')
  }
  ensureVanilla(n_)
  n_.sendLine('.lodash fp')
  ensureFp(n_)
  n_.sendLine('.lodash reset')
  ensureVanilla(n_)
  n_.sendLine('.lodash swap')
  ensureFp(n_)
  n_.sendLine('.lodash swap')
  ensureVanilla(n_)
  await n_.waitClose()
  t.deepEqual(n_.logs.map(stripAnsi), [
    'Setting lodash _ to fp flavor!',
    'Setting lodash _ to vanilla flavor!',
    'Setting lodash _ to fp flavor!',
    'Setting lodash _ to vanilla flavor!',
  ])

  const fpn_ = await getNREPL({ fp: true })
  fpn_.sendLine('const obj = {a: 2}')
  ensureFp(fpn_)
  fpn_.sendLine('.lodash')
  fpn_.sendLine('.lodash oups')
  fpn_.sendLine('.lodash help')
  fpn_.sendLine('.lodash version')
  fpn_.sendLine('.lodash current')
  fpn_.sendLine('.lodash vanilla')
  ensureVanilla(fpn_)
  fpn_.sendLine('.lodash reset')
  ensureFp(fpn_)
  await fpn_.waitClose()

  t.deepEqual(fpn_.logs.map(stripAnsi), [
    'Please provide a sub-command for .lodash',
    helpText,
    "there is no 'oups' sub-command, see available ones with '.lodash help'",
    helpText,
    `Current lodash version is ${_.VERSION}`,
    'Current lodash flavor is fp',
    'Setting lodash _ to vanilla flavor!',
    'Setting lodash _ to fp flavor!',
  ])
})

test('should use lodash/fp with fp mode enabled', async (t) => {
  const n_ = await getNREPL({ fp: true }) // --fp
  n_.sendLine('_.map(function(v) { return v * 2; }, [1, 2, 3])')
  await n_.waitClose()
  t.deepEqual(n_.last, [2, 4, 6])
})

// test 'should throw in strict mode set via command line option', was moved to integration

test('should save and load repl history across multiple sessions', async (t) => {
  const historyPath = path.join(TMP_FOLDER, `.n_repl_history-${Date.now()}`)
  const args = { historyPath } // ensure all repl instances with have same history

  // write on consecutive sessions
  await (await getNREPL(args)).sendLine('1+2').waitClose()
  await (await getNREPL(args)).sendLine('null').waitClose()
  await (await getNREPL(args)).sendLine('"foobar"').waitClose()

  // check history (as thoroughly as possible)
  const historyFileContent = fs.readFileSync(historyPath, 'utf-8')
  t.deepEqual(historyFileContent.split('\n'), ['1+2', 'null', '"foobar"', ''])

  const n_ = await getNREPL()
  n_.sendLine(`.load ${historyPath}`)
  await n_.waitClose()
  t.is(n_.last, 'foobar')
})
