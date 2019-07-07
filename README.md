# ngr

CLI for building Angular with Rollup and Closure Compiler

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
    * [Help](#help)
* [Development](#development)
    * [Build](#build)
    * [Production](#production)
    * [Hooks](#buildhooks)
    * [Config](#buildconfig)
    * [Server](#server)
    * [Libraries](#library)
    * [Schematics, Testing, and i18n](#testing)

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


## Help

`ngr --help` will list all commands and arguments provided in the cli.

```

Options:

  -V, --version              output the version number
  new [string]               scaffold new development environment in directory by name, i.e. ngr new my-app
  --src [string]             specify a path to an existing src folder
  --skip-install [bool]      prevents install during scaffold
  --yarn [bool]              use yarn instead of npm to install
  --prettier [bool]          scaffold a new workspace with prettier installed
  --ssl [bool]               scaffold a new workspace with https express server
  --angularVersion [string]  scaffold a new workspace with a specific version of angular
  build [env]                build the application
  --env [string]             use that particular environment.ts during the build, just like @angular/cli
  --clean [bool]             destroy the build folder prior to compilation, default for prod
  --watch [bool]             listen for changes in filesystem and rebuild
  --config [string]          path to configuration file for library build
  --deploy [bool]            call deploy build hook for library build
  --verbose [bool]           log all messages in list format
  --closure [bool]           bundle and optimize with closure compiler (default)
  --rollup [bool]            bundle with rollup and optimize with closure compiler
  --webpack [bool]           use @angular/cli to build
  g, generate [string]       generate schematics packaged with angular-rollup
  serve, --serve [bool]      spawn the local express server
  -h, --help                 output usage information
  ```


# Development

## Build

`ng serve` to build for development using `@angular/cli`.

To build the app for development with `@angular/compiler-cli`, enable livereload, and start up the server:

* `$ ngr build dev --watch --serve`

`ngr` will build the application for development using AOT in --watch mode.


## Production

* `$ ngr build prod`

You can choose to bundle with Rollup instead and simplify Closure Compiler's configuration, at the expense of bundle size.

* `$ ngr build prod --rollup`

Use native `ng` commands for webpack.

* `$ ng build --prod`

To build an application for production and serve it locally:

* `$ ngr build prod --serve`


## Build Hooks

Hooks are points in the build where you can inject custom functionality. Each build has a `pre` and `post` hook. All hooks except `post` require that you return a `Promise`. There is a `watch` hook for the development build that takes two parameters: `dist` and `src`. There is a `deploy` hook for the library build to run additional scripts for deployment.

```
    hooks: {
        prod: {
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


## ngr.config.js

Config is shared with `angular.json` but for non Webpack builds the following files allow you configure filepaths, SASS options, and includes callbacks for steps in each build.


| Script        | Description   |
| ------------- |:-------------:|
| ngr.config.js      | Configures project filepaths, build hooks |
| postcss.config.js |  Configures postcss step in each build |
| rollup.config.js |  Configures rollup when using `ngr build --rollup` |
| closure.rollup.conf |  Configures Closure Compiler when using `ngr build --rollup`  |
| closure.conf |  Configures Closure Compiler when using `ngr build prod` |
| server.config.*.js |  Configures express server  |
| tsconfig.*.json | Configures TypeScript (dev) or @angular/compiler (lib,prod)


## Server

Express is used mainly to provide a development server, but it could also boilerplate for a MEAN stack.

`server.js` and `router.js` are stored in the `backend` folder.

`ngr serve` will start up the Express server, so will `--serve` with any build.


### Configure Server

Change the host and/or port in `/config/server.config.dev.js` if needed. This config is used for the Express Server. `/config/server.config.prod.js` is used for production.

```
{
   origin: 'localhost',
   port: 4200
};

```

## Libraries

`ngr` provides a build for developing Angular libraries that conforms to the Angular Package Format.

Jason Aden gave a presentation about Angular Package Format at ng-conf 2017. [Packaging Angular](https://youtu.be/unICbsPGFIA).


### Generate A Library Package

Generate library packages with `ngr generate lib my-lib-name`.

This will generate a library package in the current folder with the necessary configuration set in `ngr.config.js`.


### Tips For Developing A Library

- Keep your code strictly typed.
- Do not create monolithic `@NgModule`. Separate modules by discrete functionality. This allows the library to be treeshaken.
- In each `module.ts` `export` public components, directives, services, etc.
- Update the library index.ts with `export` for each module.

### Build Library

After you have generated some components for the library, use `ngr build lib` to build the library in the `dist` folder.

`ngr build lib my-lib-name`


## Use `@angular/cli` for Schematics, Testing, and i18n

`ng generate` works in `angular-rollup`!

Use `ng test` and `ng e2e` for unit and end to end tests, respectively.


# FAQ

### How do I include third party libraries?

The production build relies heavily on Closure Compiler, which optimizes the bundle far better than other tools. Closure Compiler relies on annotations in JavaScript to optimize the bundle. Third party libraries are often not annotated. If a library package follows the Angular Package Format it will be closure annotated because when configured, the angular compiler will convert TypeScript annotations to closure annoations using a tool called [tsickle](https://github.com/angular/tsickle). Luckily for third party libraries that are not annotated, Closure Compiler can be configured to leave variables found in external scripts unmangled. Follow this step by step to figure out which method to use.

- Does the library conform to Angular Package Format?
    YES: Will be bundled by `ngc`, inject the NgModule into your application, add to `closure.conf`
    NO: See next question

- Is the library written in ES2015?
    YES: Include the necessary library files in `closure.conf`
    NO: See next question

- Is the library formatted with UMD modules?
    YES: Include the necessary library files in `closure.conf`
    NO: You must include the library globally via `<head>` or `SystemJS`.
        Add the necessary externs to `closure.externs.js`



### How do I load a library in index.html?

If a library must be loaded prior to bootstrap, add the folder name in `ngr.config.js` to have it copied into `dist` directory during the build.

Add the script in the `<head>` or you can include third party dependencies with `SystemJS`.

```
<script>

   Promise.all([
      System.import('firebase'),
      System.import('app')
   ]);

</script>
```


For production, `ngr` will concatenante library packages into `vendor.js`.
For development, all libarary files are copied to the `dist` folder.

Vendor files are configured in `ngr.config.js` like in this example:

```
lib: {
    dev: [
        'core-js/client/shim.min.js',
        'core-js/client/shim.min.js.map',
        'zone.js/dist/zone.min.js',
        'systemjs/dist/system.js',
        'systemjs/dist/system.js.map',
        'reflect-metadata/Reflect.js',
        'reflect-metadata/Reflect.js.map',
        'tslib/tslib.js',
        '@angular',
        'rxjs'
    ],
    prod: [
        'core-js/client/shim.min.js',
        'zone.js/dist/zone.min.js',
        'systemjs/dist/system.js'
    ],
    src: 'node_modules',
    dist: 'dist/path/to/lib'
}
```


### Why are there 2 different index.html?

`angular-rollup` uses `htmlprocessor` to manipulate `index.html` while webpack works it's magic with the `index.html` provided by `@angular/cli`.

`src/index.html` is used by `@angular/cli` and `webpack`.
`src/public/index.html` is used by `angular-rollup`.

For more information about [htmlprocessor](https://www.npmjs.com/package/htmlprocessor); `src/public/index.html` is manipulated by htmlprocessor. `dev` and `prod` environment variables declared via inline comments include chunks of the `index.html` per environment.


### How do I configure SystemJS for dev for jit builds?

You must configure `system.config.js` in order to inject third party libaries for development. All JavaScript in the development build is compiled into commonjs modules, however the source code is pointing to files packaged with ES2105 modules. In `system.config.js` map each request for a library script to the umd bundle for the library. The build places each library in the `dist/path/to/project/lib` folder. SystemJS needs to know where the library is located in the `dist/path/to/project/lib` folder.


Here is an example of mapping requests for library bundles to umd bundles in `system.config.js`.

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


#### How do I import libraries the most optimal way for treeshaking?

It is a best practice to treeshake and bundle third party libraries for production, however this process only works if the third party library is packaged with a module pattern such as ES2015 modules.

It is NOT recommended to import an entire library that is treeshakable.

DON'T DO THIS : `import * from 'rxjs';`
DO THIS : `import { Observable, Observer } from 'rxjs';`

It should be noted Closure Compiler relies on named ES2015 modules and cannot handle libraries that import with `*`. If you want a third party library to be compatible with closure compiler, it is recommended to contribute named imports and exports to the open source project.



### How do I provide typings for external libraries?

Type definitions are typically packaged with the `@types` scope. Install type definitions for third party libraries with npm and list them in the tsconfig.json file in the types Array.

```
"compilerOptions": {
  "typeRoots": [ "node_modules/@types" ],
  "types": [
     "node"
  ]
}
```


### How do I update my project to the latest CLI?

`npm install -g angular-rollup@latest`


### How do I update my project to the latest versions of Angular?

- `$ ng update`

### How do I deploy?

The build command has an optional `--deploy` flag.

Use the post build hook in ngr.config.json to deploy a build. The following example is for a library, but you could use a similar hook for a production build.

Below is an example of copying the dist folder to a sibling directory that also is a git repository. The example uses `shelljs`.

```

    hooks: {
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


# License

[MIT](/LICENSE)