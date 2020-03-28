var test = require('ava')
var fs = require('fs')
var _ = require('lodash')
var main_ = require('../lib/n_')
var osHomedir = require('os').homedir()
var path = require('path')

function getNREPL (args) {
  var n_ = main_(args)
  n_.enterLine = n_._events.line // retrive line  to emit direct event
  var result = null
  n_.writer = _.wrap(n_.writer, function (writer, obj) {
    result = obj
    var stringifier = _.isObject(n_.result) ? JSON.stringify : String
    return stringifier(n_.result)
  })
  Object.defineProperty(n_, 'result', {
    get: function () {
      return result
    }
  })
  return n_
}

test('should evaluate multiline input', function (t) {
  var n_ = getNREPL()
  n_.enterLine('var users = [')
  n_.enterLine('  { "user": "fred",   "age": 48 },')
  n_.enterLine('  { "user": "barney", "age": 36 },')
  n_.enterLine('  { "user": "fred",   "age": 42 },')
  n_.enterLine('  { "user": "barney", "age": 34 }')
  n_.enterLine(']')
  t.is(n_.result, undefined)
  n_.enterLine('_.sortBy(users, function(o) { return o.user })')
  t.is(n_.result[0].user, 'barney')
  t.is(n_.result[0].age, 36)
  t.is(n_.result[1].user, 'barney')
  t.is(n_.result[1].age, 34)
  t.is(n_.result[2].user, 'fred')
  t.is(n_.result[2].age, 48)
  t.is(n_.result[3].user, 'fred')
  t.is(n_.result[3].age, 42)
})

test('should evaluate simple input', function (t) {
  var n_ = getNREPL()
  n_.enterLine('1+2')
  t.is(n_.result, 3)
})

test('should evaluate multiple lodash method calls', function (t) {
  var n_ = getNREPL()
  n_.enterLine('_.compact([1, 2, false, 4])')
  t.deepEqual(n_.result, [1, 2, 4])
  n_.enterLine('_.compact([1, false, 3, 4])')
  t.deepEqual(n_.result, [1, 3, 4])
})

test('should evaluate with built in libs', function (t) {
  var n_ = getNREPL()
  n_.enterLine('util.isArray(_.drop([1, 2, 3]))')
  t.is(n_.result, true)
  n_.enterLine('_.name')
  t.is(n_.result, 'lodash')
})

test('should overwrite special variable _', function (t) {
  var n_ = getNREPL()
  n_.enterLine('_="foobar"')
  t.is(n_.result, 'foobar')
  n_.enterLine('_.name')
  t.is(n_.result, 'lodash')
})

test('should use lodash/fp with fp mode enabled', function (t) {
  var n_ = getNREPL(['--fp'])
  n_.enterLine('_.map(function(v) { return v * 2; }, [1, 2, 3])')
  t.deepEqual(n_.result, [2, 4, 6])
})

test('should not throw in magic mode', function (t) {
  var n_ = getNREPL()
  n_.enterLine('var fixed = {}; Object.preventExtensions(fixed); fixed.newProp = 1')
  t.is(n_.result, 1)
})

test('should throw in strict mode set via command line option', function (t) {
  var n_ = getNREPL(['--use_strict'])
  n_.enterLine('var fixed = {}; Object.preventExtensions(fixed); fixed.newProp = 1')
  t.is(n_.result, null)
})

test('should save and load repl history across multiple sessions', function (t) {
  var historyPath = path.join(osHomedir, '.n_repl_history')

  // delete any previously created history file
  fs.unlinkSync(historyPath)

  // write on consecutive sessions
  getNREPL().enterLine('1+2')
  getNREPL().enterLine('null')
  getNREPL().enterLine('"foobar"')

  // check history (as thoroughly as possible)
  var historyFileContent = fs.readFileSync(historyPath, 'utf-8')
  t.deepEqual(historyFileContent.split('\n'), ['1+2', 'null', '"foobar"', ''])
  var n_ = getNREPL()
  n_.enterLine('.load ' + historyPath)
  t.is(n_.result, 'foobar')
})
