'use strict';
var repl = require('repl'),
    replServer = repl.start({
        prompt: "n_ > ",
    });
replServer.context._ = require('lodash');
