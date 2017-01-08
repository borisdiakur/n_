### 1.4.4 (2017-01-08)

* fix: all additional lodash versions are now stored in the folder _extraneous_ (resolves #19)

### 1.4.3 (2016-12-22)

* fix: `$ n_3 --fp` now throws as FP-mode does not exist in lodash@3.10.1.

### 1.4.2 (2016-12-22)

* fix: using tar.gz package to “manually” unpack lodash@3 instead of npm-install-version

### 1.4.1 (2016-12-22)

* fix: bin entry n_3 was missing in package.json

### 1.4.0 (2016-12-22)

* **n_** additionally includes lodash@^3.10.1 selectable via `n_3`

### 1.3.0 (2016-03-18)

* **n_** stores its session history under `~/.n_repl_history`

### 1.2.0 (2016-03-16)

* you can now enable FP mode via `$ n_ --fp`

### 1.1.0 (2016-01-26)

* you can now enable strict mode via `$ n_ --use_strict` or `$ NODE_REPL_MODE=strict n_` in Node.js >= 4.x

### 1.0.0 (2016-01-13)

* lodash upgrade to v4.0.0

### 0.0.8 (2015-08-13)

* you can now define a custom special variable via `$ SPECIAL_VAR=my_var n_` (see #13)
* added CHANGELOG.md
