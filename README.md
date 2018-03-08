# ngr

cli for building angular apps

This branch is experimental version of angular-rollup. It will be the future version once this branch reaches feature parity with 1.x.

Currently only a few commands are supported.

- `ngr build dev --watch`
- `ngr build prod`

Why was it necessary to refactor angular-rollup?

Over time the code has become hard to maintain. From Angular 2 - 5 there were drastic changes to the build. In Angular 4 I started supporting Closure Compiler and deprecated Rollup as the main way to bundle for production. Angular 5 the development build changed quite significantly. Angular 6 has no breaking changes so you think we would want to just maintain the status quo. The truth is the build needed to be optimized. I am also taking this chance to make the build modular and to take advantage of the latest ES2017 features available in node.

How do I use this build now?

- clone the repo
- `yarn install` or `npm install`
- `git checkout next`
- `npm link` in the root directory of the repo


If you want to revert back just checkout the master branch or run `npm unlink` to use the global.


This build is backwards compatible with 1.x with one notible exception.

The format of ngr.config.json has changed for libraries.

Before :

```
{
    dep: {
        lib:[],
        prodLib:[]
    }
}
```

After :

```
{
    lib: {
        dev:[],
        prod:[]
    }
}

```

