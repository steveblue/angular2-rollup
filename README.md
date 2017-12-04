# angular-rollup

CLI for bundling Angular with Rollup and Closure Compiler.

[![Join the chat at https://gitter.im/angular2-rollup/Lobby](https://badges.gitter.im/angular2-rollup/Lobby.svg)](https://gitter.im/angular2-rollup/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)


## Main Features

* `ngr` cli for running builds, code generation, scaffolding and more

* Fast dev environments use AOT in `--watch` mode or JIT

* Highly optimized bundle for production using Closure Compiler in ADVANCED_OPTIMIZATIONS mode

* Lazyload optimized bundles with SystemJS and Closure Compiler

* Scaffold an application with dynamic routing configured by JSON

* EXPERIMENTAL support for scaffolding a native app with Electron

* Build library packages fromatted with [Angular Package Format 5.0](https://docs.google.com/document/d/1CZC2rcpxffTDfRDs6p1cfbmKNLA6x5O-NtkJglDaBVs/preview)

* Follows [Angular Styleguide](https://angular.io/guide/styleguide)

* Test Angular code with [Jasmine](http://jasmine.github.io/) and [Karma](http://karma-runner.github.io/)

* End-to-end Angular code using [Protractor](https://angular.github.io/protractor/)

* Stylesheets with [SASS](http://sass-lang.com/) and [PostCSS](http://postcss.org)

* Error reporting with [TSLint](http://palantir.github.io/tslint/) and [Codelyzer](https://github.com/mgechev/codelyzer)



## Table of Contents

* [Getting Started](#getting-started)
    * [Install](#install)
    * [Server](#server)
    * [Config](#config)
    * [Scaffold](#scaffold)
    * [Update](#update)

* [Development](#development)
    * [Build](#build)
    * [Library Build](#library-build)
    * [Testing](#testing)
    * [Code Generation](#code-generation)
    * [Development Server](#development-server)

* [FAQ](#faq)
* [License](#license)


# Getting Started

## Install


- Install dependencies

Install the [Java JDK](http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html)

- Install the cli and global npm dependencies

`$ npm install -g angular-rollup codelyzer rimraf`

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

`node server.js` is run as a parallel process when using the `--serve` flag. You can also bring your own server if your prefer.

`router.js` configures the routes of the Express server.


## Config

There is a lot of config in this project to allow finetuning each build to developer specifications. `ngr.config.js` lets you configure filepaths, SASS options, and includes callbacks for steps in each build.


| Script        | Description   |
| ------------- |:-------------:|
| ngr.config.js      | Project filepaths, callbacks for build steps |
| karma.conf.js      | Karma      |
| postcss.*.js |  PostCSS (prod,lib) |
| rollup.config.*.js |  Rollup (prod,lib) |
| closure.conf |  Closure Compiler (prod) when using the --closure flag  |
| closure.lazy.conf |  Closure Compiler (prod) when using the --closure and --lazy flags  |
| server.config.*.js |  Express Server  |
| tsconfig.*.json | Configures TypeScript (dev) or @angular/compiler (lib,prod) |


### ngr.config.js

| Property       | Description   |
| ------------- |:-------------:|
| dep     | Files and folders that should be copied to /build/lib |
| clean      | Paths of files and folders to clean in the /build directory after /src/public is copied to /build    |
| style | Options passed to SASS |
| src |  Path to src folder |
| build |  Path to build folder  |
| dist |  Path to dist directory for the library build  |
| classPrefix | Prefix used when declaring Class |
| componentPrefix | Prefix used when declaring selector for Components |
| directivePrefix | Prefix used when declaring selector for Directives |


## Scaffold

To scaffold a new app run `ngr scaffold`. This will copy required files into the same directory.

To scaffold at a specific version of `@angular` use `--angularVersion` i.e. `ngr scaffold --angularVersion 5.0.0`

| Option       | Description   |
| ------------- |:-------------:|
| --lazy     | Demo app with lazyloaded routes |
| --dynamicRoutes      | Demo app with lazyloaded routes, JSON config for routes |
| --electron | Demo app with configuration files for electron |
| --bare |  Scaffold a simple hello world application  |



## Update

To update a project to a specific version of `@angular` use `--angularVersion` i.e. `ngr update --angularVersion 5.0.0`

Sometimes major cli releases have minimal breaking changes. Use `--cliVersion` for instructions for migrating to a specific version.



## Development


## Build

To build the app for development, enable livereload, and start up the server:

* `$ ngr build dev --watch --serve`

`ngr` will build the application for development using AOT in --watch mode.

Use the `--electron` argument instead of `--serve` if you want to test in the Electron environment.

Optionally, use `--jit` to bootstrap Angular with JIT Compiler.

Once your work has been validated with the development build, you can also test the production build.

It is recommended to bundle with Closure Compiler in ADVANCED_OPTIMIZATIONS mode.

* `$ ngr build prod`

The production build also supports lazy loading with Closure Compiler. Use the --lazy argument if you have lazyloaded routes.

* `$ ngr build prod --lazy`

You can also bundle with Rollup and then optimize with ClosureCompiler, but only with SIMPLE_OPTIMIZATIONS. This build does not support lazyloading.

* `$ ngr build prod --rollup`

If you scaffolded an app for electron use the `--electron` argument.

* `$ ngr build prod --electron`



### Library Build

`ngr` provides a build for developing Angular libraries that conforms to the Angular Package Format 5.0.

Jason Aden gave a presentation about Angular Package Format at ng-conf 2017. [Packaging Angular](https://youtu.be/unICbsPGFIA).

Package Format 5.0 is largely unchanged from 4.0, except for paths to bundles in the distributed package.

#### Generate A Library Package

Generate library packages with `ngr generate lib` or use `ngr generate wizard`.

`ngr generate lib --name my-lib --dir src/app/shared/lib`

This will generate a library package in the src/app/shared/lib folder with the necessary configuration.

#### Developing A Library

- Keep your code strictly typed.
- Do not create monolithic `@NgModule`, separate modules by discrete functionality. This allows the library to be treeshaken.
- In each module export the necessary components, directives, services, etc.
- Update the index.ts with exports for each module.

#### Build Library

Update the version number of the library's package.json prior to building.

After you have generated some components for the library, use `ngr build lib` to build the library in the `dist` folder.

`ngr build lib -c src/app/shared/lib/lib.config.json`



## Testing

### 1. Unit Tests

Unit tests use Karma and can be run with the `--watch` flag.

For single run

```
ngr build jit
npm run test
```

For a shortcut, add `ngr build jit` to the `pretest` field in your package.json.


### 2. End-to-End Tests (aka. e2e, integration)

Prior to running tests run `npm run webdriver:update`

e2e tests use Protractor and Selenium Webdriver. The process requires multiple tabs to run locally.

  1. In a new tab: *if not already running!* `npm run webdriver:start`
  2. In a new tab: `ngr build jit --serve`

* Single run:
  3. In a new tab: `npm run e2e`

* Interactive mode:
  3. In a new tab: `npm run e2e:live`

When debugging or first writing test suites, you may find it helpful to try out Protractor commands without starting up the entire test suite. You can do this with the element explorer. Learn more about [Protractor Interactive Mode here](https://github.com/angular/protractor/blob/master/docs/debugging.md#testing-out-protractor-interactively).


## Code Generation

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

You can configure prefixes for Classes, Component and Directive selector in `ngr.config.js`. Omit the properties from the config to operate without prefixes. Defaults are included that follow the Angular Styleguide.

Generate a unit test with the wizard (`ngr generate wizard`) or use the following example as a guide.

`ngr generate unit --dir src/app/shared/components/my-component --name my-component`


## Development Server

You can choose to run an Express server in parallel with build tasks, with or without Livereload enabled

- `ngr build dev --watch --serve` Builds development environment, runs Express server with livereload
- `ngr serve` Run the Express server. Make sure you have built beforehand!

Production builds do not require the CLI to be served with the default Express server, just the package.json.

- `NODE_ENV=prod ngr serve` Run Express server with SSL for production, requires `./conf/ssl/key.pem` and `./conf/ssl/cert.pem`.



# FAQ

### Can I use the CLI in the context of an existing application?

Yes. This feature became readily available in 1.0.0-rc.4. Just include a `ngr.config.js` file at the root of your application. The file can be empty, it just serves as a marker for the root of your application.


### How do I include third party libraries?

The production build relies heavily on Closure Compiler, which provides excellent optimizations but unfortunately is not compatible with most third party libraries. Luckily, Closure Compiler can be configured to build referencing methods and variables found in external scripts. Follow this step by step questionaire to figure out which method to use.

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


#### How do I import libraries the most optimal way for treeshaking?

It is a best practice to tree shake and bundle third party libraries for production, however this process only works if the third party library is packaged with a module pattern such as ES2015 modules.

It is NOT recommended to import an entire library that is treeshakable like so:

`import Rx from "rxjs/Rx";`

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


Editing index.html

`ngr` copies each dependency from `node_modules` into `/build/lib` (or wherever you specify in `ngr.config.js`). You can then reference the library in `src/public/index.html` like so:

```
    <script src="/lib/core-js/client/shim.min.js"></script>
    <script src="/lib/zone.js/dist/zone.js"></script>
    <!-- build:remove:prod -->
      <script src="/lib/reflect-metadata/Reflect.js"></script>
    <!-- /build -->
```

`ngr` uses `htmlprocessor` to only include the porttions of `index.html` the app requires for development and production. You can remove chucks of the file for each build. For more information about [htmlprocessor](https://www.npmjs.com/package/htmlprocessor);

The typical Angular dependencies are already included in the `<head>` tag in `index.html`.


### How can I customize the different builds?

There are hooks in the current build scripts where you are inject custom functionality. Each build (jit, dev, prod, and lib) have a `pre` and `post` hook. All hooks except `post` require that you return a `Promise`. The `lib` build includes an additional `clean` hook for stripping out unnecessary files from the dist folder.

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


### How do I update my project to the latest CLI?

`npm install -g angular-rollup@latest`


### How do I update my project to the latest versions of Angular?

After you have finished updating the `package.json`, run the following commands:


- `$ ngr update --angularVersion 5.0.0`
- `$ npm run clean:install`


### Can I run LiveReload with the Production build?

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
