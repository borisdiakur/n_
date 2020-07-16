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

## Repl specificities

#### Commands
Some commands are available to facilitate some operations, and are host under `.lodash` repl command:
- `.lodash fp`: switch to lodash/fp
- `.lodash vanilla`: switch to _vanilla_ lodash mode
- `.lodash reset`: switch to initial lodash mode
- `.lodash swap`: switch to the other lodash mode (_vanilla_/_fp_)
- `.lodash current`: output current lodash flavor in use
- `.lodash version`: output lodash version in use

and the `.lodash help` to have more details about lodash repl commands

#### `__` as _last evaluated expression_
Special character `_` refer to the lodash instance, and cannot hold value of last expression.
To provide the same feature, `__` was introduced:

```shell
n_ > 10 + 2
12
n_ > 'number '+ __
'number 12'
```

#### Configuration options

Aside `--fp` and `--use_strict`/`--use-strict`, some other options are available either as CLI flags, or via environment variables.(with a trailing `_N_`)

The two main feature you can control is _History persistance_ and _Prompt Theme_.

| Flag | aliases|Env variable| Description|Default
|-|-|--|-|-|
|`--history-path`|`--history`, `history-file`|`_N_HISTORY_PATH`|Location of repl history file|_`~/.n_repl_history`_|
|`--prompt.symbol`||`_N_PROMPT__SYMBOL`|Symbol to use as `$` prompt|_`>`_|
|`--prompt.name`||`_N_PROMPT__NAME`|Name for the prompt |_`n_`_|
|`--prompt.color.name`||`_N_PROMPT__COLOR__NAME`|Color for prompt name `n_`|`blue`|
|`--prompt.color.symbol`||`_N_PROMPT__COLOR__SYMBOL`|Color for prompt symbol|_`red`_|
|`--prompt.color.flavor`||`_N_PROMPT__COLOR__FLAVOR`|Color for section of prompt about lodash flavor in use|`cyan`|
|`--prompt.color.help`||`_N_PROMPT__COLOR__HELP`|Color for section of prompt about lodash flavor in use|`green`|


About styling, valid colors are: `black`, `red`, `green`, `yellow`, `blue`, `magenta`, `cyan`, `white`,`gray`, and `dim`.

-----
Enjoy! :rocket:
