# n_

Lo-Dash REPL

[![NPM](https://nodei.co/npm/n_.png?downloads=true)](https://nodei.co/npm/n_/)

## Why
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

Enjoy!
