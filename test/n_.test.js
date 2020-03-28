var test = require('ava')
var fs = require('fs')
var stream = require('stream')
var _ = require('lodash/fp')
var main_ = require('../lib/n_')
var path = require('path')

var NODE_MAJOR = _.pipe(_.get('node'), _.split('.'), _.head, Number)(process.versions)
var TMP_FOLDER = path.join(__dirname, '..', 'tmp', `histories--${new Date().toISOString().replace(/T.*$/, '')}--${process.pid}`)

function getNREPL (args = []) {
  if (!args.includes('--history-path')) {
    // ensure isolated history file for the test
    args = args.concat(['--history-path', path.join(TMP_FOLDER, '.n_history-' + Date.now())])
  }

  const capturedOutput = []
  var exposedInput = new stream.PassThrough()
  var n_ = main_(args, {
    output: new stream.Writable({
      write (chunck, encoding, cb) {
        capturedOutput.push(chunck)
        cb()
      }
    }),
    input: exposedInput // need to be explicit if setting put. (later could feed directly input)
    // note: using process.input cause MaxListenersExceededWarning to appear in test
  })

  // helper to retrive line to emit direct event
  n_.sendLine = function (line) {
    n_._events.line(line)
    return n_ // for chainable calls
  }
  n_.exposedInput = exposedInput
  n_.waitClose = function (beforeCloseDelay = 200, afterCloseDelay = 120) {
    return new Promise((resolve) => {
      setTimeout(() => {
        n_.on('close', () => setTimeout(resolve, afterCloseDelay))
        n_.close()
      }, beforeCloseDelay)
    })
  }

  Object.defineProperty(n_, 'capturedOutput', { get () { return capturedOutput.join('\n') } })
  // TODO: later could use capturedOutput to add extract test (after cleaning prompts and else)
  return n_
}

test.before(t => {
  for (var folder of [path.dirname(TMP_FOLDER), TMP_FOLDER]) { if (!fs.existsSync(folder)) { fs.mkdirSync(folder) } }
})

test('should evaluate multiline input', async t => {
  var n_ = t.context.repl = getNREPL()
  n_.sendLine('var users = [')
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

test('should evaluate simple input', async t => {
  var n_ = getNREPL()
  n_.sendLine('1+2')
  await n_.waitClose()
  t.is(n_.last, 3)
})

test('should evaluate multiple lodash method calls', async t => {
  var n_ = getNREPL()
  n_.sendLine('_.compact([1, 2, false, 4])')
  t.deepEqual(n_.last, [1, 2, 4])
  n_.sendLine('_.compact([1, false, 3, 4])')
  await n_.waitClose()
  t.deepEqual(n_.last, [1, 3, 4])
})

test('should evaluate with built in libs', async t => {
  var n_ = getNREPL()
  n_.sendLine('util.isArray(_.drop([1, 2, 3]))')
  t.is(n_.last, true)
  n_.sendLine('_.name')
  await n_.waitClose()
  t.is(n_.last, 'lodash')
})

test('should overwrite special variable _', async t => {
  var n_ = getNREPL()
  n_.sendLine('_="foobar"')
  t.is(n_.last, 'foobar')
  n_.sendLine('_.name')
  await n_.waitClose()
  t.is(n_.last, 'lodash')
})

test('should use lodash/fp with fp mode enabled', async t => {
  var n_ = getNREPL(['--fp'])
  n_.sendLine('_.map(function(v) { return v * 2; }, [1, 2, 3])')
  await n_.waitClose()
  t.deepEqual(n_.last, [2, 4, 6])
})

test('should not throw in magic mode', async t => {
  var n_ = getNREPL()
  n_.sendLine('var fixed = {}; Object.preventExtensions(fixed); fixed.newProp = 1')
  await n_.waitClose()
  t.is(n_.last, 1)
})

test('should throw in strict mode set via command line option', async t => {
  var n_ = getNREPL(['--use_strict'])
  n_.sendLine('var fixed = {}; Object.preventExtensions(fixed); fixed.newProp = 1')
  await n_.waitClose()

  if (NODE_MAJOR >= 10) {
    t.is(n_.lastError.name, 'TypeError')
    t.is(n_.lastError.message, 'Cannot add property newProp, object is not extensible')
  }
  t.is(n_.last, undefined)
})

test('should save and load repl history across multiple sessions', async t => {
  var historyPath = path.join(TMP_FOLDER, '.n_repl_history-' + Date.now())
  var args = ['--history-path', historyPath] // ensure all repl instances with have same history

  // write on consecutive sessions
  await getNREPL(args).sendLine('1+2').waitClose()
  await getNREPL(args).sendLine('null').waitClose()
  await getNREPL(args).sendLine('"foobar"').waitClose()

  // check history (as thoroughly as possible)
  var historyFileContent = fs.readFileSync(historyPath, 'utf-8')
  t.deepEqual(historyFileContent.split('\n'), ['1+2', 'null', '"foobar"', ''])

  var n_ = getNREPL()
  n_.sendLine('.load ' + historyPath)
  await n_.waitClose()
  t.is(n_.last, 'foobar')
})
