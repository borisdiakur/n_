var test = require('ava')
var fs = require('fs')
var _ = require('lodash/fp')
var main_ = require('../lib/n_')
var osHomedir = require('os').homedir()
var path = require('path')

var NODE_MAJOR = _.pipe(_.get('node'), _.split('.'), _.head, Number)(process.versions)

function getNREPL (args) {
  var n_ = main_(args)
  // helper to retrive line to emit direct event
  n_.sendLine = n_._events.line
  return n_
}

test('should evaluate multiline input', function (t) {
  var n_ = getNREPL()
  n_.sendLine('var users = [')
  n_.sendLine('  { "user": "fred",   "age": 48 },')
  n_.sendLine('  { "user": "barney", "age": 36 },')
  n_.sendLine('  { "user": "fred",   "age": 42 },')
  n_.sendLine('  { "user": "barney", "age": 34 }')
  n_.sendLine(']')
  t.is(n_.last, undefined)
  n_.sendLine('_.sortBy(users, function(o) { return o.user })')
  t.is(n_.last[0].user, 'barney')
  t.is(n_.last[0].age, 36)
  t.is(n_.last[1].user, 'barney')
  t.is(n_.last[1].age, 34)
  t.is(n_.last[2].user, 'fred')
  t.is(n_.last[2].age, 48)
  t.is(n_.last[3].user, 'fred')
  t.is(n_.last[3].age, 42)
})

test('should evaluate simple input', function (t) {
  var n_ = getNREPL()
  n_.sendLine('1+2')
  t.is(n_.last, 3)
})

test('should evaluate multiple lodash method calls', function (t) {
  var n_ = getNREPL()
  n_.sendLine('_.compact([1, 2, false, 4])')
  t.deepEqual(n_.last, [1, 2, 4])
  n_.sendLine('_.compact([1, false, 3, 4])')
  t.deepEqual(n_.last, [1, 3, 4])
})

test('should evaluate with built in libs', function (t) {
  var n_ = getNREPL()
  n_.sendLine('util.isArray(_.drop([1, 2, 3]))')
  t.is(n_.last, true)
  n_.sendLine('_.name')
  t.is(n_.last, 'lodash')
})

test('should overwrite special variable _', function (t) {
  var n_ = getNREPL()
  n_.sendLine('_="foobar"')
  t.is(n_.last, 'foobar')
  n_.sendLine('_.name')
  t.is(n_.last, 'lodash')
})

test('should use lodash/fp with fp mode enabled', function (t) {
  var n_ = getNREPL(['--fp'])
  n_.sendLine('_.map(function(v) { return v * 2; }, [1, 2, 3])')
  t.deepEqual(n_.last, [2, 4, 6])
})

test('should not throw in magic mode', function (t) {
  var n_ = getNREPL()
  n_.sendLine('var fixed = {}; Object.preventExtensions(fixed); fixed.newProp = 1')
  t.is(n_.last, 1)
})

test('should throw in strict mode set via command line option', function (t) {
  var n_ = getNREPL(['--use_strict'])
  n_.sendLine('var fixed = {}; Object.preventExtensions(fixed); fixed.newProp = 1')

  if (NODE_MAJOR >= 10) {
    t.is(n_.lastError.name, 'TypeError')
    t.is(n_.lastError.message, 'Cannot add property newProp, object is not extensible')
  }
  t.is(n_.last, undefined)
})

test('should save and load repl history across multiple sessions', function (t) {
  var historyPath = path.join(osHomedir, '.n_repl_history')

  // delete any previously created history file
  fs.unlinkSync(historyPath)

  // write on consecutive sessions
  getNREPL().sendLine('1+2')
  getNREPL().sendLine('null')
  getNREPL().sendLine('"foobar"')

  // check history (as thoroughly as possible)
  var historyFileContent = fs.readFileSync(historyPath, 'utf-8')
  t.deepEqual(historyFileContent.split('\n'), ['1+2', 'null', '"foobar"', ''])
  var n_ = getNREPL()
  n_.sendLine('.load ' + historyPath)
  t.is(n_.last, 'foobar')
})
