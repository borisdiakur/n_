'use strict';
/* global describe, it */

var assert = require('assert'),
    _ = require('lodash'),
    n_ = require('../lib/n_'),
    line = n_.rli._events.line,
    result = null;

n_.writer = _.wrap(n_.writer, function (writer, obj) {
    result = obj;
    if (_.isObject(result)) {
        return JSON.stringify(result);
    } else {
        return String(result);
    }
});

function reset() {
    // delete n_ require cache
    delete require.cache[require.resolve('../lib/n_.js')];

    // now require and setup n_ (it should now use the custom special var)
    n_ = require('../lib/n_');
    line = n_.rli._events.line;
    result = null;
    n_.writer = _.wrap(n_.writer, function (writer, obj) {
        result = obj;
        if (_.isObject(result)) {
            return JSON.stringify(result);
        } else {
            return String(result);
        }
    });
}

describe('n_', function () {

    describe('default special var', function () {
        it('should evaluate multiline input', function (done) {
            line('var users = [');
            line('    { "user": "fred",   "age": 48 },');
            line('    { "user": "barney", "age": 36 },');
            line('    { "user": "fred",   "age": 42 },');
            line('    { "user": "barney", "age": 34 }');
            line('];');
            assert.equal(result, undefined);
            line('_.sortBy(users, function(o) { return o.user; });');
            assert.deepEqual(result, [
                { user: 'barney', age: 36 },
                { user: 'barney', age: 34 },
                { user: 'fred', age: 48 },
                { user: 'fred', age: 42 }
            ]);
            done();
        });
        it('should evaluate simple input', function (done) {
            line('1+2');
            assert.equal(result, 3);
            done();
        });
        it('should evaluate multiple lodash method calls', function (done) {
            line('_.compact([1, 2, false, 4])');
            assert.deepEqual(result, [1, 2, 4]);
            result = null;
            line('_.compact([1, false, 3, 4])');
            assert.deepEqual(result, [1, 3, 4]);
            done();
        });
        it('should evaluate with built in libs', function (done) {
            line('util.isArray(_.drop([1, 2, 3]))');
            assert.equal(result, true);
            line('_.name');
            assert.equal(result, 'lodash');
            done();
        });
        it('should redirect to $', function (done) {
            line('"abc"');
            assert.equal(result, 'abc');
            result = null;
            line('$');
            assert.equal(result, 'abc');
            done();
        });
        it('should overwrite _', function (done) {
            line('_="foobar"');
            assert.equal(result, 'foobar');
            result = null;
            line('_');
            assert.equal(result, 'foobar');
            done();
        });
    });

    describe('custom special var', function () {
        it('should redirect to #', function (done) {
            // set a custom special var
            process.env.SPECIAL_VAR = 'qux';

            // now require and setup n_ (it should now use the custom special var)
            reset();

            line('"abc"');
            assert.equal(result, 'abc');
            result = null;
            line('qux');
            assert.equal(result, 'abc');
            line('_.compact([1, false, 3, null])');
            assert.deepEqual(result, [1, 3]);
            done();
        });
    });

    if (process.version.indexOf('v0.') !== 0) {
        describe('strict mode in node >= 4.x', function (done) {
            it('should not throw in magic mode', function (done) {
                line('var fixed = {}; Object.preventExtensions(fixed); fixed.newProp = 1;');
                assert.equal(result, 1);
                done();
            });
            it('should throw in strict mode set via environment variable', function (done) {
                // enable strict mode
                process.env.NODE_REPL_MODE = 'strict';

                // now require and setup n_ (it should now run in strict mode)
                reset();

                line('var fixed = {}; Object.preventExtensions(fixed); fixed.newProp = 1;');
                assert.equal(result, null);
                done();
            });
            it('should throw in strict mode set via command line option', function (done) {
                // reset environment variab
                process.env.NODE_REPL_MODE = undefined;

                // enable strict mode
                process.argv.push('--use_strict');

                // now require and setup n_ (it should now run with strict mode enabled)
                reset();

                line('var fixed = {}; Object.preventExtensions(fixed); fixed.newProp = 1;');
                assert.equal(result, null);
                done();
            });
        });
    }
});
