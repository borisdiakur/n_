# n_

Node.js REPL with lodash

[![Build Status](https://travis-ci.org/borisdiakur/n_.svg?branch=master)](https://travis-ci.org/borisdiakur/n_)
[![Coverage Status](https://coveralls.io/repos/borisdiakur/n_/badge.svg?branch=master)](https://coveralls.io/r/borisdiakur/n_?branch=master)
[![npm version](https://badge.fury.io/js/n_.svg)](http://badge.fury.io/js/n_)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

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

## Notes

### Special character `_`

The behavior of assigning `_` to the last evaluated expression is disabled, since lodash is already assigned to `_`.

### History persistence

**n_** stores its session history under `~/.n_repl_history`.

Enjoy!
