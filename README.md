# n_

Node.js REPL with lodash

[![Coverage Status](https://coveralls.io/repos/borisdiakur/n_/badge.svg?branch=master)](https://coveralls.io/r/borisdiakur/n_?branch=master)

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

Use lodash's functional programming variant `lodash/fp`:

```shell
$ n_ --fp
n_ > _.map(function(v) { return v * 2; }, [1, 2, 3]);
[ 2, 4, 6 ]
n_ >
```

### Strict mode

Enable strict mode:

```shell
$ n_ --use_strict
n_ >
```

## Repl specificities

### Commands
Commands which facilitate changing the lodash flavor can be executed with the `.lodash` repl command:
- `.lodash fp`: switch to lodash/fp
- `.lodash vanilla`: switch to _vanilla_ lodash mode
- `.lodash reset`: switch to initial lodash mode
- `.lodash swap`: switch to the other lodash mode (_vanilla_/_fp_)
- `.lodash current`: output current lodash flavor in use
- `.lodash version`: output lodash version in use

Use `.lodash help` to view the available repl commands within the repl.

### `__` as _last evaluated expression_
The special character `_` refers to the lodash instance, and cannot hold the value of the last expression.
Use `__` to access the last expression instead:

```shell
n_ > 10 + 2
12
n_ > 'number ' + __
'number 12'
```

### Configuration options

Aside from `--fp` and `--use_strict`/`--use-strict`, other options are available either as CLI flags or via environment variables (with a trailing `_N_`).

Available cli options can be viewed with:

```shell
n_ --help
```

-----
Enjoy! :rocket:
