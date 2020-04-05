const test = require('ava')
const stripAnsi = require('strip-ansi')

const { exec, spawn } = require('child_process')

test.cb('should protect about wrong custom colors', t => {
  exec(`node ${__dirname}/../bin/n_ --prompt.color.help=no-color`, (err, stdout, stderr) => {
    t.is(err.code, 1)
    t.is(stripAnsi(stderr).trim(), "Invalid provided option: Unsupported color 'no-color' for 'help' color")
    t.end()
  })
})

test.cb('should throw in strict mode set via command line option', t => {
  t.timeout(2000)

  const n_ = spawn('node', [`${__dirname}/../bin/n_`, '--use_strict'])
  const output = []
  n_.stdout.on('data', data => output.push(stripAnsi(data.toString())))

  n_.stdin.setEncoding('utf-8')
  n_.stdin.write('const fixed = {}; Object.preventExtensions(fixed); fixed.newProp = 1\n\n')
  n_.stdin.end()

  n_.on('exit', code => {
    t.is(code, 0)
    t.true(output.join('').includes('TypeError: Cannot add property newProp, object is not extensible'), 'Type error was not sent')
    t.end()
  })
})

test.cb('should not throw in magic mode', t => {
  t.timeout(2000)

  const n_ = spawn('node', [`${__dirname}/../bin/n_`])
  const output = []
  n_.stdout.on('data', data => output.push(stripAnsi(data.toString())))

  n_.stdin.setEncoding('utf-8')
  n_.stdin.write('const fixed = {}; Object.preventExtensions(fixed); fixed.newProp = 1\n\n')
  n_.stdin.end()

  n_.on('exit', code => {
    t.is(code, 0)
    const fullOutput = output.join('')
    t.false(fullOutput.includes('TypeError: Cannot add property newProp, object is not extensible'), 'Type error was not sent')
    t.true(fullOutput.includes(1), '1 was not returned as result')
    t.end()
  })
})
