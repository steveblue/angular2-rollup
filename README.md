# angular-rollup

### 2.0.0-beta.0

cli for building angular apps

2.0.0-beta.0 is the next generation of angular-rollup. 2.0.0 will be released once we reach feature parity with 1.x.

Currently only a few commands are supported.

- `ngr scaffold`
- `ngr build prod`
- `ngr build dev --watch`
- `ngr build jit`

# How To Update

`npm install -g angular-rollup@2.0.0-beta.0`

# ngr --help

There are new cli arguments. Review the changes by running `ngr --help`.

# Report Issues

[https://github.com/steveblue/angular2-rollup/issues](https://github.com/steveblue/angular2-rollup/issues)

# Not All Builds Are Fully Operational

2.0.0-beta currently only supports building a single bundle. Lazyloading, Universal, Electron, and i18n are not yet ready for consumption. If your app relies on any of these builds, stay with 1.x until these features are rolled into 2.0.0-beta.

# Upgrade Existing Project

The easiest way to upgrade is to scaffold a new app (`ngr scaffold`) and overwrite the `ngr.config.json` and `src` directory with the old.


