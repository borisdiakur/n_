var test = require('ava')
const stripAnsi = require('strip-ansi')

var { exec } = require('child_process')

test.cb('should protect about wrong custom colors', t => {
  exec(`node ${__dirname}/../lib/n_ --prompt.color.help=no-color`, (err, stdout, stderr) => {
    t.is(err.code, 1)
    t.is(stripAnsi(stderr).trim(), "Invalid provided option: Unsupported color 'no-color' for 'help' color")
    t.end()
  })
})
