/* eslint-env mocha */

var assert = require('assert')
var fs = require('fs')
var _ = require('lodash')
var n_ = require('../lib/n_')
var line = n_.rli._events.line
var osHomedir = require('os-homedir')
var path = require('path')
var result = null

n_.writer = _.wrap(n_.writer, function (writer, obj) {
  result = obj
  if (_.isObject(result)) {
    return JSON.stringify(result)
  } else {
    return String(result)
  }
})

function reset () {
  // delete n_ require cache
  delete require.cache[require.resolve('../lib/n_.js')]

  // now require and setup n_
  n_ = require('../lib/n_')
  line = n_.rli._events.line
  result = null
  n_.writer = _.wrap(n_.writer, function (writer, obj) {
    result = obj
    if (_.isObject(result)) {
      return JSON.stringify(result)
    } else {
      return String(result)
    }
  })
}

describe('n_', function () {
  it('should evaluate multiline input', function (done) {
    line('var users = [')
    line('  { "user": "fred",   "age": 48 },')
    line('  { "user": "barney", "age": 36 },')
    line('  { "user": "fred",   "age": 42 },')
    line('  { "user": "barney", "age": 34 }')
    line(']')
    assert.strictEqual(result, undefined)
    line('_.sortBy(users, function(o) { return o.user })')
    assert.strictEqual(result[0].user, 'barney')
    assert.strictEqual(result[0].age, 36)
    assert.strictEqual(result[1].user, 'barney')
    assert.strictEqual(result[1].age, 34)
    assert.strictEqual(result[2].user, 'fred')
    assert.strictEqual(result[2].age, 48)
    assert.strictEqual(result[3].user, 'fred')
    assert.strictEqual(result[3].age, 42)
    done()
  })

  it('should evaluate simple input', function (done) {
    line('1+2')
    assert.strictEqual(result, 3)
    done()
  })

  it('should evaluate multiple lodash method calls', function (done) {
    line('_.compact([1, 2, false, 4])')
    assert.deepStrictEqual(result, [1, 2, 4])
    result = null
    line('_.compact([1, false, 3, 4])')
    assert.deepStrictEqual(result, [1, 3, 4])
    done()
  })

  it('should evaluate with built in libs', function (done) {
    line('util.isArray(_.drop([1, 2, 3]))')
    assert.strictEqual(result, true)
    line('_.name')
    assert.strictEqual(result, 'lodash')
    done()
  })

  it('should overwrite special variable _', function (done) {
    line('_="foobar"')
    assert.strictEqual(result, 'foobar')
    result = null
    line('_.name')
    assert.strictEqual(result, 'lodash')
    done()
  })

  it('should use lodash/fp with fp mode enabled', function (done) {
    // enable fp mode
    var previousArgv = process.argv
    process.argv = _.concat(previousArgv, ['--fp'])

    // now require and setup n_ (it should now use lodash/fp)
    reset()
    // reset argv to previous value
    process.argv = previousArgv

    line('_.map(function(v) { return v * 2; }, [1, 2, 3])')
    assert.deepStrictEqual(result, [2, 4, 6])
    done()
  })

  it('should not throw in magic mode', function (done) {
    line('var fixed = {}; Object.preventExtensions(fixed); fixed.newProp = 1')
    assert.strictEqual(result, 1)
    done()
  })

  it('should throw in strict mode set via command line option', function (done) {
    // enable strict mode
    var previousArgv = process.argv
    process.argv = _.concat(previousArgv, ['--use_strict'])

    // now require and setup n_ (it should now run with strict mode enabled)
    reset()
    // reset argv to previous value
    process.argv = previousArgv

    line('var fixed = {}; Object.preventExtensions(fixed); fixed.newProp = 1')
    assert.strictEqual(result, null)
    done()
  })

  it('should save and load repl history across multiple sessions', function (done) {
    var historyPath = path.join(osHomedir(), '.n_repl_history')

    // delete any previously created history file
    fs.unlinkSync(historyPath)

    reset() // new session
    line('1+2')
    reset() // new session
    line('null')
    reset() // new session
    line('"foobar"')
    reset() // new session

    // check history (as thoroughly as possible)
    var historyFileContent = fs.readFileSync(historyPath, 'utf-8')
    assert.strictEqual(historyFileContent, ['1+2', 'null', '"foobar"', ''].join('\n'))
    line('.load ' + historyPath)
    assert.strictEqual(result, 'foobar')
    done()
  })
})
