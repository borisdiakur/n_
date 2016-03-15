'use strict';

// used as the special var to assign the result of REPL expressions
var specialVar = process.env.SPECIAL_VAR || '$';

// store method reference in case it is overwritten later
var getDescriptor = Object.getOwnPropertyDescriptor,
    setDescriptor = Object.defineProperty;

// create REPL server instance
var repl = require('repl'),
    server = repl.start({
        prompt: 'n_ > ',
        // allow strict mode via environment variable
        replMode: (process.env.NODE_REPL_MODE === 'strict' || process.argv.indexOf('--use_strict') !== -1) ? repl.REPL_MODE_STRICT : repl.REPL_MODE_MAGIC
    });

// create new pristine `lodash` instance
var _ = require('lodash').runInContext(server.context);

var lodashToInject = process.argv.indexOf('--fp') === -1 ? _ : require('lodash/fp').runInContext(server.context);

// state vars
var prevVal = lodashToInject,
    currVal = lodashToInject;

// inject lodash into the context
setDescriptor(server.context, '_', {
    'configurable': true,
    'enumerable': false,
    'get': function () {
        return currVal;
    },
    'set': function (val) {
        prevVal = currVal;
        currVal = val;
    }
});

// redirect REPL changes of `_` to the new special variable
_.each(repl._builtinLibs, function (name) {
    var context = server.context,
        descriptor = getDescriptor(context, name);

    setDescriptor(context, name, _.assign(descriptor, {
        'get': _.wrap(descriptor.get, function (get) {
            var context = server.context,
                result = get();

            context[specialVar] = context._;
            currVal = prevVal;
            return result;
        })
    }));
});

var events = server.rli._events;
events.line = _.wrap(events.line, function (line, cmd) {
    var context = server.context;
    line(cmd);
    context[specialVar] = context._;
    currVal = prevVal;
});

module.exports = server;
