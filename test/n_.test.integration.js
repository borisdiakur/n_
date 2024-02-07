const test = require('ava').default

const childProcess = require('child_process')
const spawn = childProcess.spawn

test('should throw in strict mode set via command line option', async (t) => {
  t.timeout(4000)

  const n_ = spawn('node', ['bin/n_', '--use_strict'])
  const output = []
  n_.stdout.on('data', (data) => output.push(data.toString()))

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
    'Type error was not sent',
  )
})

test('should not throw in magic mode', async (t) => {
  t.timeout(4000)

  const n_ = spawn('node', [`${__dirname}/../bin/n_`])
  const output = []
  n_.stdout.on('data', (data) => output.push(data.toString()))

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
    'Type error was not sent',
  )
  t.true(fullOutput.includes('1'), '1 was not returned as result')

  t.is(code, 0)
})
