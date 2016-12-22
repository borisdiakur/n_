# n_

Node.js REPL with lodash

[![Build Status](https://travis-ci.org/borisdiakur/n_.svg?branch=master)](https://travis-ci.org/borisdiakur/n_)
[![Coverage Status](https://coveralls.io/repos/borisdiakur/n_/badge.svg?branch=master)](https://coveralls.io/r/borisdiakur/n_?branch=master)
[![Dependency Status](https://gemnasium.com/borisdiakur/n_.svg)](https://gemnasium.com/borisdiakur/n_)
[![npm version](https://badge.fury.io/js/n_.svg)](http://badge.fury.io/js/n_)

![animated gif showing usage of n_](https://cloud.githubusercontent.com/assets/527049/6358450/ddcb3144-bc6b-11e4-81bd-a3661407f87a.gif)

## Why?
Sometimes we use the Node.js REPL interface to experiment with code.
Wouldn’t it be great to have that interface with lodash required by default?

## Installation

```shell
$ npm install -g n_
```

## Usage

```shell
$ n_
n_ >
```

lodash is now attached to the REPL context as `_`, so just use it:

```shell
n_ > _.compact([0, 1, false, 2, '', 3]);
[ 1, 2, 3 ]
n_ >
```

### FP mode

It is possible to use lodash’s functional programming variant `lodash/fp`:

```shell
$ n_ --fp
n_ > _.map(function(v) { return v * 2; }, [1, 2, 3]);
[ 2, 4, 6 ]
n_ >
```

### Strict mode

It is possible to enable strict mode in Node.js >= 4.x:

```shell
$ n_ --use_strict
n_ >
```

Or alternatively:

```shell
$ NODE_REPL_MODE=strict n_
n_ >
```

### Using a different lodash version

**n_** additionally includes all major versions of lodash starting with lodash@^3.10.1 selectable via `n_<major version number>`:

```shell
$ n_3
n_ > _.pluck
[Function: pluck]
n_ >
```

If lodash has made another major jump and I didn’t notice, give me a heads-up.

## Notes

### Special character `_`

#### node < 6.x

The `_` character is special in the Node REPL (see [nodejs.org/api/repl.html](http://nodejs.org/api/repl.html#repl_repl_features)).

In node versions < 6.x **n_** redirects this special variable to `$` per default, but you can set your own using the environment variable `SPECIAL_VAR` like this:

```shell
$ SPECIAL_VAR=my_var n_
n_ > 123
123
n_ > my_var
123
n_ >
```

Also note that in node < 6.x using the command `.clear` you clear the context lodash is bound to.

#### node >= 6.x

The behavior of assigning `_` to the last evaluated expression is disabled, since lodash is already assigned to `_`.

### History persistence

**n_** stores its session history under `~/.n_repl_history`.

Enjoy!
