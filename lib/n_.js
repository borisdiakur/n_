'use strict';

var osHomedir = require('os-homedir'),
    path = require('path'),
    replHistory = require('repl.history');

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

// save repl history
replHistory(server, path.join(osHomedir(), '.n_repl_history'));

// create new pristine `lodash` instance
var _ = require(process.env.N_LODASH_REQUIRE_PATH || 'lodash').runInContext(server.context);

var lodashToInject = process.argv.indexOf('--fp') === -1 ? _ : require(path.join((process.env.N_LODASH_REQUIRE_PATH || 'lodash'), 'fp')).runInContext(server.context);

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

var useRedirect = parseInt(process.version.split('.')[0].split('v')[1]) < 6; // node < 6.x
function redirect(context) {
    /* istanbul ignore next */ // we do cover this - see .travis.yml
    if (useRedirect) {
        context[specialVar] = context._;
    }
}

// in node < 6.x redirect REPL changes of `_` to the new special variable
_.each(repl._builtinLibs, function (name) {
    var context = server.context,
        descriptor = getDescriptor(context, name);

    setDescriptor(context, name, _.assign(descriptor, {
        'get': _.wrap(descriptor.get, function (get) {
            var context = server.context,
                result = get();

            redirect(context);
            currVal = prevVal;
            return result;
        })
    }));
});

var events = server.rli._events;
events.line = _.wrap(events.line, function (line, cmd) {
    var context = server.context;
    line[0](cmd); // actual command execution
    line[1](cmd); // history persistance
    redirect(context);
    currVal = prevVal;
});

module.exports = server;
