'use strict';

// store method reference in case it is overwritten later
var getDescriptor = Object.getOwnPropertyDescriptor;

// create repl server instance
var server = require('repl').start({ 'prompt': 'n_ > ' });

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
    'enumerable'  : true
}));

var events = server.rli._events;
events.line = _.wrap(events.line, function (callback, cmd) {
    callback(cmd);
    var context = server.context;

    // redirect `_` to `$` if our wiring is still in place
    if (_.isEqual(accessor, _.pick(getDescriptor(context, '_'), 'get', 'set'))) {
        context.$ = context._;
    }
    currVal = prevVal;
});