# angular-rollup

CLI for bundling Angular with Rollup and Closure Compiler.

[![Join the chat at https://gitter.im/angular2-rollup/Lobby](https://badges.gitter.im/angular2-rollup/Lobby.svg)](https://gitter.im/angular2-rollup/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)


## Main Features

* `ngr` cli for running builds, code generation, scaffolding and more

* Fast dev environments use AOT in `--watch` mode or JIT

* Highly optimized bundle for production using Closure Compiler

* Lazyload optimized bundles with SystemJS and Closure Compiler

* Scaffold an application with dynamic routing configured by JSON

* EXPERIMENTAL support for building a native app with Electron

* Build library packages that follow [Angular Package Format 4.0](https://docs.google.com/document/d/1CZC2rcpxffTDfRDs6p1cfbmKNLA6x5O-NtkJglDaBVs/preview)

* Follows [Angular Styleguide](https://angular.io/guide/styleguide)

* Ready to go build system using [ngc](https://github.com/angular/angular/tree/master/modules/%40angular/compiler-cli), [Rollup](http://rollupjs.org), and [Closure Compiler](https://developers.google.com/closure/compiler/)

* Test Angular 2 code with [Jasmine](http://jasmine.github.io/) and [Karma](http://karma-runner.github.io/)

* End-to-end Angular 2 code using [Protractor](https://angular.github.io/protractor/)

* Stylesheets with [SASS](http://sass-lang.com/) and [PostCSS](http://postcss.org)

* Error reporting with [TSLint](http://palantir.github.io/tslint/) and [Codelyzer](https://github.com/mgechev/codelyzer)


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

`$ ngr build dev --serve --watch`

When everything is setup correctly, you should be able to visit  [http://localhost:4200](http://localhost:4200) in your browser.


## Table of Contents

* [Getting Started](#getting-started)
    * [Dependencies](#dependencies)
    * [Install](#install)
    * [Server](#server)
    * [Config](#config)
    * [Scaffold](#scaffold)
    * [Update](#update)
* [Develop](#develop)
    * [Build](#build)
    * [Testing](#testing)
* [CLI](#cli)
* [Frequently Asked Questions](#faq)
* [License](#license)


# Getting Started

## Dependencies

What you need to run this app:
* `node` and `npm` (Use [NVM](https://github.com/creationix/nvm))
* Ensure you're running Node (`6.9.0`+)

## Install

[Read the Quick Start](#quick-start)

- Install dependencies

To run Closure Compiler, you need to install the [Java SDK](http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html).
Selenium Webdriver requires [Python](https://www.python.org).


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


## Config

There is a lot of config in this project to allow finetuning each build to developer specifications. `build.config.js` lets you configure filepaths, SASS options, and includes callbacks for steps in each build.


| Script        | Description   |
| ------------- |:-------------:|
| build.config.js      | Project filepaths, dev, lib, and prod builds |
| karma.conf.js      | Karma      |
| postcss.*.js |  PostCSS (prod,lib) |
| rollup.config.*.js |  Rollup (prod,lib) |
| closure.conf |  Closure Compiler (prod) when using the --closure flag  |
| closure.lazy.conf |  Closure Compiler (prod) when using the --closure and --lazy flags  |
| server.config.*.js |  Express Server  |
| jsconfig.json |  VSCode editor  |
| tsconfig.*.json | Configures TypeScript (dev) or @angular/compiler (lib,prod) |


### build.config.js

| Property       | Description   |
| ------------- |:-------------:|
| dep     | Files and folders that should be copied to /build/lib |
| clean      | Paths of files and folders to clean in the /build directory after /src/public is copied to /build    |
| style | Options passed to SASS |
| src |  Path to src folder |
| build |  Path to build folder  |
| dist |  Path to dist directory for the library build  |
| lib |  Path to library root folder  |
| libFilename |  filename used for bundles created during library build |
| classPrefix | Prefix used when declaring Class |
| componentPrefix | Prefix used when declaring selector for Components |
| directivePrefix | Prefix used when declaring selector for Directives |


## Scaffold

To scaffold a new app run `ngr scaffold`. This will copy required files into the same directory.

To scaffold at a specific version of `@angular` use `--angularVersion` i.e. `ngr scaffold --angularVersion 5.0.0`

If you want access to the library build, use `ngr scaffold --lib`

If you want to build a project for native app development with Electron use `ngr scaffold --electron`



## Update

To update a project to a specific version of `@angular` use `--angularVersion` i.e. `ngr update --angularVersion 5.0.0`


# Develop


## Build

To build the app for development, enable livereload, and start up the server:

* `$ ngr build dev --watch --serve`

`ngr` will build the application for development.

Optionally, use `--jit` to bootstrap Angular with JIT Compiler.

Once your work has been validated with the development build, you can also test the production build.

It is recommended to bundle with Closure Compiler in ADVANCED_OPTIMIZATIONS mode.

* `$ ngr build prod`

The production build also supports lazy loading with Closure Compiler.

* `$ ngr build prod --lazy`

You can also bundle with Rollup and then optimize with ClosureCompiler, but only with SIMPLE_OPTIMIZATIONS. This build does not support lazyloading.

* `$ ngr build prod --rollup`


NOTE: If you scaffolded an app for electron use the `--electron` argument.



### Package Format 5.0 Library Build

* `$ ngr build lib`

`ngr` provides a build for developing Angular libraries that conforms to the Angular Package Format 5.0.

Jason Aden gave a presentation about Angular Package Format 4.0 at ng-conf 2017. [Packaging Angular](https://youtu.be/unICbsPGFIA).

Package Format 5.0 is largely unchanged from 4.0, except for conforming some of the bundles to specific paths in the distributed package.

Generate the configuration required for library packages with `ngr generate lib` or use `ngr generate wizard`.

`ngr generate lib --name my-lib --dir src/app/shared/lib`

After you have generated some components for the library, use `ngr build lib` to build the library in the `dist` folder.

`ngr build lib -c src/app/shared/lib/lib.config.json`

Once all the necessary configuration files are in place and some modules have been generated for the library, make sure import each module in the `index.ts`. In each module, export all the necessary classes.




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


The `angular-rollup` CLI includes a few more useful commands. Display all supported commands with `ngr --help`.


#### generate

`ngr generate` helps generate code quickly within your scaffoled app. The easiest way to generate code is to use the wizard.

`ngr generate wizard`

Example of output from the wizard:

```
$ ngr generate wizard
$ ngr codegen wizard
$ filename: kabab-case filename i.e. global-header
$ directory: path/to/folder i.e. src/app/shared/components/global-header
$ type: module, component, directive, enum, e2e, guard, interface, pipe, service
$ Follow the prompts after selecting a type
filename:  global-header
directory:  src/app/shared/components/global-header
type:  module
component:  y
directive:  n
routes:  n
unit:  y
e2e:  n
[15:38:18] LOG global-header.component.html copied to global-header
[15:38:18] LOG global-header.component.scss copied to global-header
[15:38:18] LOG global-header.component.ts copied to global-header
[15:38:18] LOG global-header.module.spec.ts copied to global-header
[15:38:18] LOG global-header.module.ts copied to global-header
```

Optionally, you can trigger codegen via the CLI with arguments.

You can pass the following types to `generate`:

- class
- component
- directive
- enum
- unit
- e2e
- guard
- interface
- module
- pipe
- service

EXAMPLE: `ngr generate service --name todo-list --dir path/to/folder`

When generating a module, there is an optional `--include` flag what will auto import various other types into the Module, scaffold spec and e2e tests.

- `ngr generate module --name todo-list --include route,component,route,directive`

This example generates files for configuring routes, component, and directive and then auto imports those files into the module.

You can configure prefixes for Classes, Component and Directive selector in `build.config.js`. Omit the properties from the config to operate without prefixes. Defaults are included that follow the Angular Styleguide.

Generate a unit test with the wizard (`ngr generate wizard`) or use the following example as a guide.

`ngr generate unit --dir src/app/shared/components/my-component --name my-component`


#### --serve & --watch

You can choose to run an Express server in parallel with build tasks, with or without Livereload enabled

- `ngr build dev --watch --serve` Builds development environment, runs Express server with livereload
- `ngr serve` Runs Express server, make sure you have built beforehand!

Production builds do not require the CLI, just the package.json

- `NODE_ENV=prod ngr serve` Run Express server with SSL for production, requires `./conf/ssl/key.pem` and `./conf/ssl/cert.pem`.



# FAQ

## How do I include third party libraries?

The production build relies heavily on Closure Compiler, which provides excellent optimizations but unfortunately is not compatible with most third party libraries. Luckily, Closure Compiler can be configured to build referencing methods and variables found in external scripts. Follow this step by step questionaire to figure out which method to use.

- Does the library conform to Angular Package Spec 4.0?
    YES: Will be bundled by `ngc`, inject the NgModule into your application, add to `closure.conf` and/or closure.lazy.conf
    NO: See next question

- Is the library written in ES2015?
    YES: Include the necessary library files in `closure.conf`
    NO: See next question

- Is the library formatted with UMD modules?
    YES: Include the necessary library files in `closure.conf`
    NO: You must include the library globally via `<head>` or `SystemJS`. Add the necessary externs to `closure.externs.js`



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
      'rxjs/Observable': 'lib:rxjs/observable',
      'tslib': 'lib:tslib/tslib.js'
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


#### Bundling libraries

It is a best practice to tree shake and bundle third party libraries for production, however this process only works if the third party library is packaged with a module pattern such as ES2015 modules.

It is NOT recommended to import an entire library that is treeshakable like so:

`import Rx from "rxjs/Rx";`

While you could do this, it is a best practice to only import the methods of the library your app requires. This will signifcantly shrink the size of the bundle Closure Compiler creates.

```
import { map } from 'rxjs/operators/map';

```

Closure Compiler cannot handle libraries that import ES2015 modules with `*`.



#### Typings

You may also need to inject `typings` for `ngc` to properly inject dependencies during AOT compilation.

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

`ngr` uses `htmlprocessor` to only include the porttions of `index.html` the app requires for development and production. You can remove chucks of the file for each build. For more information about [htmlprocessor](https://www.npmjs.com/package/htmlprocessor);

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

Livereload is still available in this mode, however you have to go an extra step to unlock this feature for the prod build. We recommend using `ngr build dev` for development, which uses AOT in --watch mode, mirroring the production build in a lot of ways. In cases where you want to test the production build on a local machine with the watcher you can use the following command: `ngr build prod --watch --serve`


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
