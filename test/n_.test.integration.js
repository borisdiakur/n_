const test = require('ava').default
const stripAnsi = require('strip-ansi')
const util = require('node:util')

const childProcess = require('child_process')
const spawn = childProcess.spawn

const exec = util.promisify(childProcess.exec)

test('should protect about wrong custom colors', async (t) => {
  try {
    await exec('node bin/n_ --prompt.color.help=no-color')
    t.is(false, true)
  } catch (err) {
    t.is(
      stripAnsi(err.stderr).trim(),
      "Invalid provided option: Unsupported color 'no-color' for 'help' color"
    )
  }
})

test('should throw in strict mode set via command line option', async (t) => {
  t.timeout(4000)

  const n_ = spawn('node', ['bin/n_', '--use_strict'])
  const output = []
  n_.stdout.on('data', (data) => output.push(stripAnsi(data.toString())))

  n_.stdin.write('const fixed = {}; Object.preventExtensions(fixed); fixed.newProp = 1\n\n')
  n_.stdin.end()

  const code = await new Promise((resolve) => {
    n_.on('exit', (code) => {
      resolve(code)
    })
  })
  t.is(code, 0)
  t.true(
    output.join('').includes('TypeError: Cannot add property newProp, object is not extensible'),
    'Type error was not sent'
  )
})

test('should not throw in magic mode', async (t) => {
  t.timeout(4000)

  const n_ = spawn('node', [`${__dirname}/../bin/n_`])
  const output = []
  n_.stdout.on('data', (data) => output.push(stripAnsi(data.toString())))

  n_.stdin.write('const fixed = {}; Object.preventExtensions(fixed); fixed.newProp = 1\n\n')
  n_.stdin.end()

  const code = await new Promise((resolve) => {
    n_.on('exit', (code) => {
      resolve(code)
    })
  })

  const fullOutput = output.join('')
  t.false(
    fullOutput.includes('TypeError: Cannot add property newProp, object is not extensible'),
    'Type error was not sent'
  )
  t.true(fullOutput.includes('1'), '1 was not returned as result')

  t.is(code, 0)
})
