# ngr

CLI for building Angular with Rollup, Closure Compiler and Webpack

[![Join the chat at https://gitter.im/angular2-rollup/Lobby](https://badges.gitter.im/angular2-rollup/Lobby.svg)](https://gitter.im/angular2-rollup/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## Main Features

* Extends `@angular/cli`. Run `ng` and `ngr` commands in the same project

* Generates highly optimized bundle using Closure Compiler

* Builds library packages formatted with [Angular Package Format](https://docs.google.com/document/d/1CZC2rcpxffTDfRDs6p1cfbmKNLA6x5O-NtkJglDaBVs/preview)

* Includes Express server for ramping up backend NodeJS production

* Stylesheets with [SASS](http://sass-lang.com/) and [PostCSS](http://postcss.org)

* Follows [Angular Styleguide](https://angular.io/guide/styleguide)

* Pretty printed error reporting with [TSLint](http://palantir.github.io/tslint/) and [Codelyzer](https://github.com/mgechev/codelyzer)


## Table of Contents

* [Getting Started](#getting-started)
    * [Install](#install)
    * [Scaffold](#scaffold)

* [Development](#development)
    * [Build](#build)
    * [Production](#production)
    * [Hooks](#buildhooks)
    * [Config](#buildconfig)
    * [Server](#server)
    * [Library Build](#library-build)
    * [Code Generation, Testing, and i18n](#testing)

* [FAQ](#faq)
* [License](#license)


# Getting Started

## Install


- Install dependencies

Install the [Java JDK](http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html)

- Install the cli and global npm dependencies

`$ npm install -g angular-rollup`

- Apps are scaffolded just like the `@angular/cli`. Use `ngr` instead of `ng`.

```

$ ngr new my-app

```

## Scaffold

To scaffold a new app run `ngr new my-app`. This command will copy required files into the a new directory called my-app and run `npm install`. Use the `--yarn` flag to install with it instead.

Migrate existing angular-rollup and @angular/cli projects with `--src`.

`ngr new my-new-app --src /path/to/old/src`


# Development

## Build

To build the app for development, enable livereload, and start up the server:

* `$ ngr build dev --watch --serve`

`ngr` will build the application for development using AOT in --watch mode.

Optionally, use `--jit` to bootstrap Angular with JIT Compiler.

Once your work has been validated with the development build, you can also test the production build.

We recommended bundling and optimizing with Closure Compiler in ADVANCED_OPTIMIZATIONS mode. This is the default production build because it produces the most optimal bundles.

## Production

* `$ ngr build prod`

You can choose to bundle with Rollup instead and simplify Closure Compiler's configuration, at the expense of bundle size.

* `$ ngr build prod --rollup`

Trigger `ng build --prod` with the `--webpack` argument. Use native `ng` commands for further customization of the webpack build.

* `$ ngr build prod --webpack`

To build an application and serve it locally:

* `$ ngr build prod --serve`


## Build Hooks

There are hooks in the current build scripts where you can inject custom functionality. Each build has a `pre` and `post` hook. All hooks except `post` require that you return a `Promise`.

```
    buildHooks: {
        dev: {
            pre: () => {
                return new Promise((res, rej) => {
                    // do something
                    res();
                })
            },
            post: () => {
              // do something
            }
        }
    }
```

If you require a new hook, submit a feature request in Github issues.


## Build Config

Config is shared with `angular.json` but for non Webpack builds the following files allow you configure filepaths, SASS options, and includes callbacks for steps in each build.


| Script        | Description   |
| ------------- |:-------------:|
| ngr.config.js      | Project filepaths, callbacks for build steps |
| postcss.*.js |  PostCSS |
| rollup.config.js |  Rollup |
| closure.conf |  Closure Compiler  |
| closure.rollup.conf |  Closure Compiler when using the --rollup argument  |
| server.config.*.js |  Express Server  |
| tsconfig.*.json | Configures TypeScript (dev) or @angular/compiler (lib,prod)


## Server

Express is used mainly to provide a development server, but it could also be s atrting point for a MEAN stack.

`ngr serve` will start up the Express server, so will `--serve` with any build.


### Configure Server

Change the host and/or port in `/config/server.config.dev.js` if needed. This config is used for the Express Server. `/config/server.config.prod.js` is used for production.

```
{
   origin: 'localhost',
   port: 4200
};

```

## Library Build

`ngr` provides a build for developing Angular libraries that conforms to the Angular Package Format.

Jason Aden gave a presentation about Angular Package Format at ng-conf 2017. [Packaging Angular](https://youtu.be/unICbsPGFIA).


### Generate A Library Package

Generate library packages with `ngr new lib`.

`ngr new lib --name my-lib --dir src/app/shared/lib`

This will generate a library package in the src/app/shared/lib folder with the necessary configuration.


### Developing A Library

- Keep your code strictly typed.
- Do not create monolithic `@NgModule`, separate modules by discrete functionality. This allows the library to be treeshaken.
- In each module export the necessary components, directives, services, etc.
- Update the index.ts with exports for each module.

### Build Library

After you have generated some components for the library, use `ngr build lib` to build the library in the `dist` folder.

`ngr build lib --config src/app/shared/lib/lib.config.json`


## Code Generation, Testing, and i18n

All of this tooling uses the methods employed by `@angular/cli`. Use `ng test` and `ng e2e`.


# FAQ

### How do I include third party libraries?

The production build relies heavily on Closure Compiler, which provides excellent optimizations but unfortunately is not compatible with most third party libraries. Luckily, Closure Compiler can be configured to build referencing methods and variables found in external scripts. Follow this step by step to figure out which method to use.

- Does the library conform to Angular Package Spec 5.0?
    YES: Will be bundled by `ngc`, inject the NgModule into your application, add to `closure.conf` and/or closure.lazy.conf
    NO: See next question

- Is the library written in ES2015?
    YES: Include the necessary library files in `closure.conf`
    NO: See next question

- Is the library formatted with UMD modules?
    YES: Include the necessary library files in `closure.conf`
    NO: You must include the library globally via `<head>` or `SystemJS`. Add the necessary externs to `closure.externs.js`



### How do I load a library in index.html?

If a library must be loaded prior to bootstrap, add the folder name in `ngr.config.js` to have it copied into `build/lib` during the build. It is optimal to only include the library files you need for production, not entire folders.

Add the script in the `<head>` or you can include third party dependencies with `SystemJS` instead of the `<head>`.

```
<script>

   Promise.all([
      System.import('firebase'),
      System.import('app')
   ]);

</script>
```


### How do I configure SystemJS for dev for jit builds?


You must configure `system.config.js` in order to inject third party libaries for development. Just map each request for a library to the umd bundle for the library. The build places wach library in the `build/lib` folder. SystemJS needs to know where the library is located in the `build/lib` folder.

```
   map: {
      // angular bundles
      '@angular/core': 'lib:@angular/core/bundles/core.umd.js',
      '@angular/common': 'lib:@angular/common/bundles/common.umd.js',
      '@angular/compiler': 'lib:@angular/compiler/bundles/compiler.umd.js',
      '@angular/platform-browser': 'lib:@angular/platform-browser/bundles/platform-browser.umd.js',
      '@angular/platform-browser-dynamic': 'lib:@angular/platform-browser-dynamic/bundles/platform-browser-dynamic.umd.js',
      '@angular/http': 'lib:@angular/http/bundles/http.umd.js',
      '@angular/router': 'lib:@angular/router/bundles/router.umd.js',
      '@angular/forms': 'lib:@angular/forms/bundles/forms.umd.js',
      // other libraries
      'rxjs/Observable': 'lib:rxjs/Observable',
      'tslib': 'lib:tslib/tslib.js'
    }
```

```
module.exports = {
    lib: {
        dev: [
          'core-js/client/shim.min.js',
          'core-js/client/shim.min.js.map',
          'systemjs/dist/system.js',
          'zone.js/dist/zone.js',
          'reflect-metadata/Reflect.js',
          'reflect-metadata/Reflect.js.map',
          'tslib/tslib.js',
          '@angular',
          'rxjs'
        ],
        prod: [
          'core-js/client/shim.min.js',
          'core-js/client/shim.min.js.map',
          'systemjs/dist/system.js',
          'zone.js/dist/zone.js'
        ],
        src: './node_modules',
        dist: './build/lib'
    },
```


#### How do I import libraries the most optimal way for treeshaking?

It is a best practice to tree shake and bundle third party libraries for production, however this process only works if the third party library is packaged with a module pattern such as ES2015 modules.

It is NOT recommended to import an entire library that is treeshakable like so:

`import * from 'rxjs';`

While you could do this, it is a best practice to only import the methods of the library your app requires. This will signifcantly shrink the size of the bundle Closure Compiler creates.

```
import { map } from 'rxjs/operators/map';

```

Closure Compiler cannot handle libraries that import ES2015 modules with `*`.



### How do I provide typings for external libraries?

You may also need to inject `typings` for `ngc` to properly inject dependencies during AOT compilation.

```
"compilerOptions": {
  "typeRoots": [ "node_modules/@types" ],
  "types": [
     "node"
  ]
}
```


### Editing index.html

In the development build, `ngr` copies each dependency from `node_modules` into `/build/lib` (or wherever you specify in `ngr.config.js`). You can then reference the library in `src/public/index.html` like so:

```
    <script src="/lib/core-js/client/shim.min.js"></script>
    <script src="/lib/zone.js/dist/zone.js"></script>
    <!-- build:remove:prod -->
      <script src="/lib/reflect-metadata/Reflect.js"></script>
    <!-- /build -->
```

For production, `ngr` will concatenante library packages into `vendor.js`.

#### htmlprocessor

`ngr` uses `htmlprocessor` to only include the porttions of `index.html` the app requires for development and production. You can remove chucks of the file for each build. For more information about [htmlprocessor](https://www.npmjs.com/package/htmlprocessor);

The typical Angular dependencies are already included in the `<head>` tag in `index.html`.


### How do I update my project to the latest CLI?

`npm install -g angular-rollup@latest`


### How do I update my project to the latest versions of Angular?

- `$ ng update`

### How do I deploy?

The build command has an optional `--deploy` flag. All cli arguments pass through to build hooks.

Use the post build hook in ngr.config.json to deploy a build. The following example is for a library, but you could use a similar hook for a production build.

Below is an example of copying the dist folder to a sibling directory that also is a git repository. The example uses `shelljs`.

```

    buildHooks: {
        lib: {
            post: (args) => {
                cp('-R', './dist/.', '../'+folderName);
                rm('-rf', './dist');

                if (args.indexOf('deploy=true')) {
                    cd('../'+folderName);
                    exec('git add --all .');
                    exec('git commit -a -m "version bump"');
                    exec('git push origin master');
                }
            }
        }
    }

```

## VSCode Extensions

We like [Visual Studio Code](https://code.visualstudio.com/). Below are some VS Code Extensions we find useful when developing Angular applications.

| Extension       | Description   |
| ------------- |:-------------:|
| Angular Language Service     | Editor services for Angular templates |
| Angular Support      | Go to / peek angular specific definitions |
| angular2-inline | Syntax highlighting of inline html and css |
| SCSS Intellisense |  Autocompletion and refactoring of SCSS  |
| Path Intellisense     | Autocomplete for paths in the project |
| NPM Intellisense      | Autocomplete paths to node_modules |
| Auto Import ES6 & TS | Auto import for TypeScript |
| TypeScript Hero |  Additional tooling for the TypeScript language  |



# License

[MIT](/LICENSE)