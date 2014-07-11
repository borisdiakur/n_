'use strict';

// store method reference in case it is overwritten later
var getDescriptor = Object.getOwnPropertyDescriptor,
    setDescriptor = Object.defineProperty;

// create repl server instance
var repl = require('repl'),
    server = repl.start({ 'prompt': 'n_ > ' });

// create new pristine `lodash` instance
var _ = require('lodash').runInContext(server.context);

// state vars
var prevVal,
    currVal = _;

// the `_` accessor attributes
var accessor = {
    'get': function () {
        return currVal;
    },
    'set': function (val) {
        prevVal = currVal;
        currVal = val;
    }
};

// inject lodash into the context
Object.defineProperty(server.context, '_', _.assign({}, accessor, {
    'configurable': true,
    'enumerable'  : false
}));

// redirect repl changes of _ to $
_.each(repl._builtinLibs, function (name) {
    var context = server.context, descriptor = getDescriptor(context, name);

    descriptor.get = _.wrap(descriptor.get, function (get) {
        var context = server.context, result = get();

        context.$ = context._;
        currVal = prevVal;
        return result;
    });

    setDescriptor(context, name, descriptor);
});

var events = server.rli._events;
events.line = _.wrap(events.line, function (line, cmd) {
    var context = server.context;
    line(cmd);
    context.$ = context._;
    currVal = prevVal;
});