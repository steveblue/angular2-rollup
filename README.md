# angular2-rollup

[![Join the chat at https://gitter.im/angular2-rollup/Lobby](https://badges.gitter.im/angular2-rollup/Lobby.svg)](https://gitter.im/angular2-rollup/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

A complete, yet simple, starter for Angular 2 using AOT Compile and Rollup.

- `ngr build jit` compiles just in time (JIT) using [Typescript](https://www.typescriptlang.org).

- `ngr build dev` compiles ahead of time (AOT) using [ngc](https://github.com/angular/angular/tree/master/packages/compiler-cli) in `--watch` mode.

- `ngr build prod` compiles ahead of time (AOT) using [ngc](https://github.com/angular/angular/tree/master/packages/compiler-cli), bundles with [Rollup](http://rollupjs.org) and optimizes the build with [Closure Compiler](https://developers.google.com/closure/compiler/).

- `ngr build lib` runs a build script for component libraries. It uses  [ngc](https://github.com/angular/angular/tree/master/packages/compiler-cli) to make distributed components compatible with (AOT).

Build scripts written with [ShellJS](https://github.com/shelljs/shelljs) allow for cross platform support. A boilerplate [Express](http://expressjs.com) server is also included with support for LiveReload. We chose this method so anyone could write their own build that fit the needs of their project and use this starter as an example of how to do it.

* Best practices in file and application organization for [Angular 2](https://angular.io/).
* Ready to go build system using [ngc](https://github.com/angular/angular/tree/master/modules/%40angular/compiler-cli), [Rollup](http://rollupjs.org), and [Closure Compiler](https://developers.google.com/closure/compiler/)
* Test Angular 2 code with [Jasmine](http://jasmine.github.io/) and [Karma](http://karma-runner.github.io/)
* Coverage with [Istanbul](https://github.com/gotwarlost/istanbul)
* End-to-end Angular 2 code using [Protractor](https://angular.github.io/protractor/).
* Stylesheets with [SASS](http://sass-lang.com/) and [PostCSS](http://postcss.org)
* Error reporting with [TSLint](http://palantir.github.io/tslint/) and [Codelyzer](https://github.com/mgechev/codelyzer)
* CLI commands for running builds, generating code, and more!



## Quick start

NOTE: This package requires `python` and `java JDK` to be installed prior to installion. Several dependencies require these services.

- Install the cli and global dependencies

`$ npm install -g angular-rollup webdriver-manager codelyzer rimraf`

- Scaffold a new project and install dependencies

```

$ mkdir my-new-app && cd my-new-app
$ ngr scaffold && npm install

```


- Run development build, start up Express Server with LiveReload

`$ ngr build dev --jit --serve --watch` pre 5.0.0

`$ ngr build dev --serve --watch` post 5.0.0

When everything is setup correctly, you should be able to visit  [http://localhost:4200](http://localhost:4200) in your browser.



## Table of Contents

* [Getting Started](#getting-started)
    * [Dependencies](#dependencies)
    * [Install](#install)
    * [Server](#server)
    * [Scaffold](#scaffold)
    * [Update](#update)
* [Develop](#develop)
    * [Config](#config)
    * [Build](#build)
    * [Testing](#testing)
* [CLI](#cli)
* [Frequently Asked Questions](#faq)
* [License](#license)


# Getting Started

## Dependencies

What you need to run this app:
* `node` and `npm` (Use [NVM](https://github.com/creationix/nvm))
* Ensure you're running Node (`v6.5.x`+)

## Install

[Read the Quick Start](#quick-start)

- Install dependencies

To run Closure Compiler, you need to install the [Java SDK](http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html).
Selenium Webdriver requires [Python](https://www.python.org).
This project requires `node ~6.9.0` to be installed.

- Install the cli and global npm dependencies

`$ npm install -g angular-rollup webdriver-manager codelyzer rimraf`

- Scaffold a new project and install project dependencies

```

$ mkdir my-new-app && cd my-new-app
$ ngr scaffold && npm install

```


### Configure Server

Change the host and/or port in `/server.config.dev.js` if needed. This config is used for the Express Server. `/server.config.prod.js` is used for production.

```
{
   origin: 'localhost',
   port: 4200
};

```

## Server

Express is used mainly to provide a development server, but it could also be configured for production to run over `https`.

`node server.js` is run as a parallel process to the build when using the `--serve` flag

`router.js` configures the routes of the Express server


## Scaffold

To scaffold a new app run `ngr scaffold`. This will copy required files into the same directory.

To scaffold at a specific version of `@angular` use `--angularVersion` i.e. `ngr scaffold --angularVersion 4.2.2`

If you want access to the library build, use `ngr scaffold --lib`



## Update

To update to specific version of `@angular` use `--angularVersion` i.e. `ngr update --angularVersion 4.2.2`



# Develop


## Config


- `build.config.js` is the main configuration for the dev, lib, and prod builds

- `karma.conf.js` is the main configuration for Karma

- `rollup.config.js` configures Rollup for prod and lib builds

- `closure.conf` configures Closure Compiler for prod when using the --closure flag

- `closure.lazy.conf` configures Closure Compiler for prod when using the --closure and --lazy flags

- `server.config.dev.js` and `server.config.prod.js` configure the Express server

- `jsconfig.json` is boilerplate for VSCode and is not used for production

- `tsconfig.dev.json` configures Typescript in the development build

- `tsconfig.dev.json` configures Typescript in the development build (JIT)

- `tsconfig.prod.json` configures `ngc` in the production build



## Build

To build the app for development, enable livereload, and start up the server:

* `$ ngr build dev --watch --serve -jit`

`ngr` will build the application for development. Using `--jit` bootstraps Angular with JIT Compiler.

Once your work has been validated with the development build, you can also test the production build.

It is recommended to bundle with Closure Compiler in ADVANCED_OPTIMIZATIONS mode.

* `$ ngr build prod --closure --serve`

The production build also supports lazy loading with Closure Compiler.

* `$ ngr build prod --closure --lazy --serve`

You can also bundle with Rollup and then optimize with ClosureCompiler, but only with SIMPLE_OPTIMIZATIONS

* `$ ngr build prod --serve`


### Production Builds

While the development build uses Angular Just In Time (JIT) compilation in conjunction with `tsc`, the production build uses [ngc](https://github.com/angular/angular/tree/master/modules/%40angular/compiler-cli) to compile the Angular 2 application Ahead of Time (AOT).

AOT is more secure than JIT and should always be used in a production environment.

Here's how is works:

1. The `@angular/compiler` package uses `ngc` to AOT compile the files in `/src` to `/ngfactory`,

2. Closure Compiler optimizes any bundles and outputs ES5 for the browser.


### Package Spec 4.0 Library Build

* `$ ngr build lib`

`ngr` provides a build for developing Angular libraries that conforms to the Angular Package Spec 4.0.

Jason Aden gave a presentation about Angular Package Spec 4.0 at ng-conf 2017. [Packaging Angular](https://youtu.be/unICbsPGFIA).

To develop component libraries, scaffold an app with the `--lib` flag.

`tsconfig.lib.json` and `tsconfig.lib.es5.json` configure `ngc` during the library build.

The library build is configured in `build.config.js`.


## Testing


### 1. Unit Tests

Unit tests use Karma and can be run with the `--watch` flag.

For single run `ngr --test`


### 2. End-to-End Tests (aka. e2e, integration)

e2e tests use Protractor and Selenium Webdriver. The process requires multiple tabs to run locally.

  1. In a new tab: *if not already running!* `npm run webdriver:start`
  2. In a new tab: `ngr build dev --serve`

* Single run:
  3. In a new tab: `npm run e2e`

* Interactive mode:
  3. In a new tab: `npm run e2e:live`

When debugging or first writing test suites, you may find it helpful to try out Protractor commands without starting up the entire test suite. You can do this with the element explorer. Learn more about [Protractor Interactive Mode here](https://github.com/angular/protractor/blob/master/docs/debugging.md#testing-out-protractor-interactively).


# CLI

This starter code includes a CLI that allows you to build and start up an Express Server without `npm run`. The CLI includes commands for generating new code snippets similar to Angular CLI.

To use the CLI run the command `npm install -g` while in the root directory of the project, then `npm link`. `webdriver-manager` should also be installed globally if it isn't already.

`npm install -g`
`npm link`

## CLI Commands

#### ngr --help

Displays the help documentation for using `ngr`

#### build

- `ngr build dev` builds development environment
- `ngr build prod` builds production environment
- `ngr build prod --closure --lazy` bundles the app with Closure Compiler and supports lazyloading bundles
- `ngr build lib` produces an Angular library build for distribution

#### generate

You can pass the following types to `generate`:

- class
- component
- directive
- enum
- e2e
- guard
- interface
- module
- pipe
- service

EXAMPLE: `ngr generate service --name todo-list --dir path/to/folder`

When generating a module, there is an optional `--include` flag what will auto import various other types into the Module.

- `ngr generate module --name todo-list --include route,component,route,directive`

This example generates files for configuring routes, component, and directive and then auto imports those files into the module.

You can configure prefixes for Classes, Component and Directive selector in `build.config.js`. Omit the properties from the config to operate without prefixes. Defaults are included that follow the Angular Styleguide.


#### --serve & --watch

You can choose to run an Express server in parallel with build tasks, with or without Livereload enabled

- `ngr build dev --watch --serve` Builds development environment, runs Express server with livereload
- `ngr serve` Runs Express server, make sure you have built beforehand!

Production builds do not require the CLI, just the package.json

- `NODE_ENV=prod node server.js --https` Run Express server with SSL for production, requires `./conf/ssl/key.pem` and `./conf/ssl/cert.pem`.



# FAQ

## How do I include third party libraries?

Follow this step by step questionaire to figure out which method to use.

- Does the library conform to Angular Package Spec 4.0?
    YES: Will be bundled by `ngc`, inject the NgModule into your application
    NO: See next question

- Is the library compatible with ClosureCompiler in ADVANCED_OPTIMIZATIONS?
    YES: Bundle without Rollup using the `--closure` flag.
    NO: See next question

- Is the library written in ES2015?
    YES: Can most likely be bundled with `Rollup`
    NO: See next question

- Is the library formatted with UMD modules?
    YES: Edit `rollup.config.js` so Rollup can bundle the library
    NO: You must include the library globally via `<head>` or `SystemJS`. Examples of both are in `/src/public/index.html`


RxJS is bundled as UMD module. In `rollup.config.js`, use the `rollup-plugin-commonjs` to bundle it via the Rollup build step.

 ```
    commonjs({
     include: 'node_modules/rxjs/**'
    }),
```


### Configure SystemJS for the dev build

You must configure `system.config.js` in order to inject third party libaries for development. An example is below:

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
      'rxjs': 'lib:rxjs',
      'firebase': 'lib:firebase/firebase.js',
      'firebase/app': 'lib:firebase/firebase.js',
      'firebase/database': 'lib:firebase/firebase.js',
      'firebase/auth': 'lib:firebase/firebase.js'
    }
```


You can include third party dependencies with `SystemJS` instead of the `<head>`.

```
<script>

   Promise.all([
      System.import('firebase'),
      System.import('app')
   ]);

</script>
```


If a library must be loaded prior to bootstrap, add the folder name in `build.config.js` to have it copied into `build/lib`. It is optimal to only include the library files you need for production, not entire folders.

You must also edit `public/index.html` and the systemjs config files to load libraries prior to the app bootstrapping.


```
module.exports = {
    dep: {
        lib: [
          'core-js',
          'reflect-metadata',
          'zone.js',
          'systemjs',
          '@angular',
          'rxjs'
        ],
        prodLib: [
          'core-js/client/shim.min.js',
          'core-js/client/shim.min.js.map',
          'systemjs/dist/system.js',
          'zone.js/dist/zone.js'
        ],
        src: './node_modules',
        dist: './build/lib'
    },
```


#### Bundling libraries written in ES2105 Modules

It is a best practice to tree shake and bundle third party libraries for production, however this process only works with Rollup if the third party library is packaged with ES2015 modules. It is also not recommended to import an entire library that is treeshakable like so:

`import Rx from "rxjs/Rx";`

While you could do this, it is a best practice to only import the methods of the library your app requires.

```
import "rxjs/add/observable/interval";
import "rxjs/add/operator/take";
import "rxjs/add/operator/map";
import "rxjs/add/operator/bufferCount"

```

If you import an entire library using `*` for instance, the entire library will be bundled in your application, so import ONLY the methods your application requires for an optimal bundle.

`import` will only work with libraries packaged with ES2015 modules.

When bundling for production, you may need to also need to update the `rollup.config.js` file to properly bundle the third party library.



#### Typings

You may also need to inject `typings` for the `ngc` service to properly inject dependencies during AOT compilation.

```
"compilerOptions": {
  "typeRoots": [ "node_modules/@types" ],
  "types": [
     "node"
  ]
}
```


Editing index.html

`ngr` copies each dependency from `node_modules` into `/build/lib` (or wherever you specify in `build.config.js`). You can then reference the library in `src/public/index.html` like so:

```
    <script src="/lib/core-js/client/shim.min.js"></script>
    <script src="/lib/zone.js/dist/zone.js"></script>
    <!-- build:remove:prod -->
      <script src="/lib/reflect-metadata/Reflect.js"></script>
    <!-- /build -->
```

`ngr` uses `htmlprocessor` to only include the porttions of `index.html` the app requires for development and production. You can remove chucks of the file for each build.

The typical Angular 2 dependencies are already included in the `<head>` tag in `index.html`.



## How can I write a custom build?

You could create a custom build to fit the specific needs of your project. It is recommended to duplicate an existing build and start from there.

```
build.env.js

```

In `build.env.js`:

```
const env = 'dev';
```

This build script includes a constant you should change to the new name of the environment if you also want to augment other settings for `Rollup`, `TypeScript`, or `PostCSS`. Otherwise, you can hijack the `dev`, `prod` environments. There is an example of how this could be done in `build.lib.js`.

When duplicating the development build, you can tweak the `tsconfig` or `PostCSS` settings.

```
tsconfig.env.json
postcss.env.json

```

Configuration for build services are in the specific files, while the config for Closure Compiler is found in `package.json`. If you are duplicating the production build and renaming the environment, you can augment the options for ClosureCompiler:

```
"transpile:env": "java -jar ./compiler.jar --warning_level=QUIET --language_in=ES6 --language_out=ES5 --js ./build/bundle.es2015.js --js_output_file ./build/bundle.js",
```


## How do I update my project to the latest CLI?

`npm install -g angular-rollup@latest`


## How do I update my project to the latest versions of Angular?

After you have finished updating the `package.json`, run the following commands:


- `$ ngr update --angularVersion 5.0.0`
- `$ npm run clean:install`


## Can I run LiveReload with the Production build?

Livereload is still available in this mode, however you have to go an extra step to unlock this feature for the prod build. We recommend using `ngr build dev` for development, since the JIT Compiler or ngc in `--watch` mode allows for a faster workflow. In cases where you want to test the production build on a local machine with the watcher you can use the following command: `ngr build dev --watch --serve`


For livereload to work in the browser for the production build you currently you have to edit `src/public/index.html`.

Copy the livereload `script` to the `build:remove:dev` comment near the end of the file. It should look like the example below.

```
    <script>
      document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] +
      ':35729/livereload.js?snipver=1"></' + 'script>')
    </script>
    <!-- /build -->
    <!-- build:remove:dev -->
    <script src="system.import.js"></script>
    <script>
      document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] +
      ':35729/livereload.js?snipver=1"></' + 'script>')
    </script>
    <!-- /build -->
```

It is not recommended that you deploy the livereload script to production.


## How do I take advantage of TypeScript in VSCode?

Configure the jsconfig.json file.

Install the following packages:

Angular Language Service : Editor services for Angular templates
Angular Support : Go to / peek angular specific definitions
angular2-inline : Syntax highlighting of inline html and css
SCSS Intellisense: autocompletion and refactoring of SCSS
Path Intellisense: Autocomplete for paths in the project
TypeScript Hero: Additional tooling for the TypeScript language



#### Use a TypeScript-aware editor

We have good experience using these editors:

* [Visual Studio Code](https://code.visualstudio.com/)
* [Webstorm 11+](https://www.jetbrains.com/webstorm/download/)
* [Atom](https://atom.io/) with [TypeScript plugin](https://atom.io/packages/atom-typescript)
* [Sublime Text](http://www.sublimetext.com/3) with [Typescript-Sublime-Plugin](https://github.com/Microsoft/Typescript-Sublime-plugin#installation)


# License

[MIT](/LICENSE)
