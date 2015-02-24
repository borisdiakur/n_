'use strict';
/* global describe, beforeEach, afterEach, it */
/* jshint unused:vars */

var assert = require('assert'),
    _ = require('lodash'),
    n_ = require('../lib/n_'),
    line = n_.rli._events.line,
    result;

n_.writer = _.wrap(n_.writer, function (writer, obj) {
    result = obj;
    if (_.isObject(result)) {
        return JSON.stringify(result);
    } else {
        return String(result);
    }
});

describe('n_', function () {

    beforeEach(function (done) { done(); });
    afterEach(function (done) { done(); });

    describe('unit tests', function () {
        it('should evaluate multiline input', function (done) {
            line('var users = [');
            line('    { user: "barney", age: 36 },');
            line('    { user: "fred",   age: 40 },');
            line('    { user: "barney", age: 26 },');
            line('    { user: "fred",   age: 30 }');
            line('];');
            assert.equal(result, undefined);
            line('_.map(_.sortByAll(users, ["user", "age"]), _.values);');
            assert.deepEqual(result, [['barney', 26], ['barney', 36], ['fred', 30], ['fred', 40]]);
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
            line('$');
            assert.equal(result, 'abc');
            done();
        });
        it('should overwrite _', function (done) {
            line('_="foobar"');
            assert.equal(result, 'foobar');
            line('_');
            assert.equal(result, 'foobar');
            done();
        });
    });
});
