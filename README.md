# n_

Node.js REPL with lodash

[![Build Status](https://travis-ci.org/borisdiakur/n_.svg?branch=master)](https://travis-ci.org/borisdiakur/n_)
[![Coverage Status](https://coveralls.io/repos/borisdiakur/n_/badge.svg?branch=master)](https://coveralls.io/r/borisdiakur/n_?branch=master)
[![Dependency Status](https://gemnasium.com/borisdiakur/n_.svg)](https://gemnasium.com/borisdiakur/n_)

[![NPM](https://nodei.co/npm/n_.png?downloads=true)](https://nodei.co/npm/n_/)

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

__Note:__

The `_` character is special in the Node REPL (see [nodejs.org/api/repl.html](http://nodejs.org/api/repl.html#repl_repl_features)).
**n_** redirects this special variable to `$` per default, but you can set your own using the environment variable `SPECIAL_VAR` like this:

```shell
$ SPECIAL_VAR=my_var n_
n_ > 123
123
n_ > my_var
123
n_ >
```

Also note that using the command `.clear` you clear the context lodash is bound to.

Enjoy!
