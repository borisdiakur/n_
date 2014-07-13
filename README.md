# n_

Node.js REPL with Lo-Dash

[![Build Status](https://api.travis-ci.org/borisdiakur/n_.png?branch=master)](https://travis-ci.org/borisdiakur/n_)
[![Coverage Status](https://img.shields.io/coveralls/borisdiakur/n_.svg)](https://coveralls.io/r/borisdiakur/n_)
[![Dependency Status](https://gemnasium.com/borisdiakur/n_.svg)](https://gemnasium.com/borisdiakur/n_)

[![NPM](https://nodei.co/npm/n_.png?downloads=true)](https://nodei.co/npm/n_/)

## Why?
Sometimes we use the Node.js REPL interface to experiment with code.
Wouldn't it be great to have that interface with Lo-Dash required by default?

## Installation

```shell
$ npm i -g n_
```

## Usage

```shell
$ n_
n_ >
```

Lo-Dash is now atteched to the REPL context as `_`, so just use it:

```shell
n_ > _.compact([0, 1, false, 2, '', 3]);
[ 1, 2, 3 ]
n_ >
```

__Note:__ The `_` character is special in the Node REPL (see [nodejs.org/api/repl.html](http://nodejs.org/api/repl.html#repl_repl_features)).
**n_** redirects this special variable to `$`.

Enjoy!
