# angular2-rollup

[![Join the chat at https://gitter.im/angular2-rollup/Lobby](https://badges.gitter.im/angular2-rollup/Lobby.svg)](https://gitter.im/angular2-rollup/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

A complete, yet simple, starter for Angular 2 using AOT Compile and Rollup. Now supports 4.0.0+ and Library Builds!

This repo serves as an Angular 2 starter for anyone looking to get up and running fast with Angular 2 and TypeScript and Ahead Of Time (AOT) compilation. We're using [ngc](https://github.com/angular/angular/tree/master/modules/%40angular/compiler-cli) for compiling AOT and [Rollup](http://rollupjs.org) for bundling our files for production. The development server compiles just in time (JIT) using Typescript and SystemJS for fast and efficient development.

`node` scripts written with [ShellJS](https://github.com/shelljs/shelljs) allow for cross platform support for the dev environment. A boilerplate [Express](http://expressjs.com) server is also included with support for livereload.

We're also using Protractor for our end-to-end story and Karma for our unit tests.

* Best practices in file and application organization for [Angular 2](https://angular.io/).
* Ready to go build system using [ngc](https://github.com/angular/angular/tree/master/modules/%40angular/compiler-cli) and [Rollup](http://rollupjs.org).
* Testing Angular 2 code with [Jasmine](http://jasmine.github.io/) and [Karma](http://karma-runner.github.io/).
* Coverage with [Istanbul](https://github.com/gotwarlost/istanbul)
* End-to-end Angular 2 code using [Protractor](https://angular.github.io/protractor/).
* Stylesheets with [SASS](http://sass-lang.com/) and [PostCSS](http://postcss.org).
* Error reporting with [TSLint](http://palantir.github.io/tslint/) and [Codelyzer](https://github.com/mgechev/codelyzer).
* CLI Commands for running builds, Express server, and scaffolding Angular Components, etc

----------------------------------------------------------------------------------------------------

## Quick start

#### clone the repo
`$ git clone https://github.com/steveblue/angular2-rollup my-app`

#### change directory to your app
`$ cd my-app`

#### install the dependencies with npm
`$ npm install`

#### install the CLI globally
`$ npm install -g angular2-rollup`

* NOTE: This is NOT angular-cli, but a CLI developed for this starter code

#### Install the server config

Change the host and/or port in `/conf/config.local.js` if needed. This config is used for the Express Server.

```
{
   origin: 'localhost',
   port: 4200
};

```

#### Build, start the server and watchers
`$ ngr --build dev`

#### Optionally, set environment variables

`$ ngr --build prod`

#### In a second tab, start the Express Server

`$ ngr --serve`
`$ ngr --build dev --serve`

----------------------------------------------------------------------------------------------------

## Table of Contents

* [Getting Started](#getting-started)
    * [Dependencies](#dependencies)
    * [Installing](#installing)
    * [Developing](#developing)
    * [Testing](#testing)
    * [Production](#production)
* [CLI](#cli)
* [Frequently asked questions](#faq)
* [TypeScript](#typescript)
* [License](#license)

----------------------------------------------------------------------------------------------------

# Getting Started

## Dependencies

What you need to run this app:
* `node` and `npm` (Use [NVM](https://github.com/creationix/nvm))
* Ensure you're running Node (`v6.5.x`+)

## Installing

* `fork` this repo
* `clone` your fork
* `npm install` to install all dependencies

### Configure Server

Server configuration happens per environment. Currently two environments are supported: `dev` and `prod`. Create config files for each environment in the  `conf/` directory called `config.local.js` and `config.prod.js`.

The configuration file only takes two arguments for now: `origin` and `port`. `server.js` uses this configuration to initialize an Express Server either for development or production. A basic config looks like this:

```
const config = {
                 origin: 'localhost',
                 port: 4200
               };

module.exports = config;
```

When everything is setup correctly, you should be able to visit  [http://localhost:4200](http://localhost:4200) in your browser.

## Developing

After you have installed all dependencies you can now build the project:

* `$ ngr --build dev --serve`

`build.env.js` will build the application for development for the appropriate environment. `server.js` will start a local server using Express and `liveserver` will watch for changes in the `/build` directory. The development environment bootstraps Angular with JIT Compiler for fast and efficient development compared to AOT.

## Testing

NOTE: If you find issues scaling the test environment, please submit a Pull Request with bug fixes and feature requests.

#### 1. Unit Tests

* single run: `npm test`

#### 2. End-to-End Tests (aka. e2e, integration)

* single run:
  * in a tab: `ngr --build dev --serve`
  * in a new tab *if not already running!*: `npm run webdriver:start`
  * in another new tab: `npm run e2e`
* interactive mode:
  * instead of the last command above, you can run: `npm run e2e:live`
  * when debugging or first writing test suites, you may find it helpful to try out Protractor commands without starting up the entire test suite. You can do this with the element explorer.
  * you can learn more about [Protractor Interactive Mode here](https://github.com/angular/protractor/blob/master/docs/debugging.md#testing-out-protractor-interactively)

## Production

The production build is quite different than development. While the development server uses Angular Just In Time (JIT) compilation in conjunction with `tsc`, the production build uses [ngc](https://github.com/angular/angular/tree/master/modules/%40angular/compiler-cli) to compile the Angular 2 application Ahead of Time (AOT).

1. `ngc` compiles the files in `/src` to `/tmp`,

2. Rollup bundles the files and their dependencies into `build/bundle.es2015.js`.

3. Closure Compiler optimizes the bundle and outputs ES5 for the browser.

Since the bundle is still ES2015, we need to transpile the bundle into ES5. For this purpose, we tested multiple solutions and found the best option to be Closure Compiler.

In order to build for production, you need to install [Closure Compiler](https://developers.google.com/closure/compiler/). Closure Compiler is the only tool that we found would transpile the ES2015 Rollup Bundle to ES5 with 100% reliability after it was processed with `ngc`. Closure Compiler is also a great solution because it optimizes the bundle and does code checking after Rollup tree shakes the application. Google uses Closure Compiler internally to optimize JavaScript files for production.

To run Closure Compiler, you need to install the [Java SDK](http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html) and the application file found [at the bottom of this page](https://developers.google.com/closure/compiler/). Rename the .jar file (ex: closure-compiler-v20160822.jar ) to `compiler.jar` and copy it into the project root directory (`./compiler.jar`). This file is in the `.gitignore`, which is why you have to manually install it. We tested the JavaScript version of Closure Compiler and found it resulted in `out of process memory` issues with multiple versions of `node`, which is why the Java application is necessary.

To build an application for production, run the following command.

* `$ ngr --build prod`

You can now deploy the `/build` folder to your server!

# CLI

This starter code includes a CLI that allows you to build and start up an Express Server without `npm run`. The CLI also includes commands for generating new code snippets similar to Angular CLI.

#### --help

Displays the help documentation for using the `ngr` CLI.

#### --build

- `ngr --build dev --watch` Builds development environment, runs watcher
- `ngr --build prod` Builds production environment

#### --generate

- `ngr --generate component --name todo-list --spec` Generate a `TodoListComponent` in the current directory with a spec file
- `ngr --generate directive --name todo-list --dir path/to/folder` Generate a `TodoListDirective` in a folder
- `ngr -g module -n todo-list -r` Generate a `TodoListModule` in a folder with a routes.ts file

You can pass the following types to `--generate`:

- class
- component
- directive
- enum
- guard
- interface
- module
- pipe
- service

Configure prefixes for Classes, Component and Directive selector in `build.config.js`.
Omit the properties from the config to operate without prefixes.

#### --serve

`ngr --build dev --watch --serve` - Builds development environment, runs watcher and starts up Express Server


# FAQ

#### Do I need to add script / link tags into index.html ?

Yes, as of right now this starter package will not handle this for you. The typical Angular 2 dependencies have been added already. Configure more dependencies to be included in your web app in `build.config.js`. A script runs that copies each dependency from `node_modules` into `/build/lib` (or wherever you specify in the config). You can then reference the library in `src/public/index.html` like so:

```
    <script src="/lib/zone.js/dist/zone.js"></script>
    <script src="/lib/reflect-metadata/Reflect.js"></script>
```

or with SystemJS like so:

```
<script>

   Promise.all([
      System.import('firebase'),
      System.import('app')
   ]);

</script>
```


#### How do I update?

- Install rimraf globally `npm i -g rimraf`
- Run `npm run clean:install`


#### How to include external libraries?

It's simple, just install the library via npm, add the library to the build in `build.config.js` and inject the library via SystemJS in `src/public/system.config.js` and in some cases `index.html` for development. For Production, a different, minimal configuration for the bundle is required in `src/public/system.config.prod.js` and `system.import.js`.


#### How do I bundle external libraries for production?

You can bundle external dependencies with Rollup. Out of the box there is support for projects that use ES2015 modules in `rollup.config.js`. For instance, we alias the ES2015 version of rxjs when bundling like so:

```
plugins: [
  replace({ 'ENVIRONMENT': JSON.stringify( 'production' ) }),
  resolve({ module: true }),
  cleanup()
]
```

A Rollup plugin does exist that will transform commonjs modules to ES2015 for the bundle called `rollup-plugin-commonjs` and it is included in package.json by default.

#### Can I run livereload with the Production build?

Livereload is still available in this mode, however you have to go an extra step to unlock this feature for the prod build. We recommend using`npm run build:dev` for development, since JIT compile allows for a faster workflow. In cases where you want to test the production build on a local machine with the watcher you can use the following command: `npm run build:prod watch=true`

Then, start up the production server

`NODE_ENV=prod npm run dev:server watch=true`

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

It is not recommended that you deploy the livereload script to production. If anyone has a clever workaround for this please submit a Pull Request with the change.


#### Can I use this repository to package a library for distribution?

- `ngr --build lib`

With Angular 4.0, there is an established contract between the Angular team, library authors, and application developers that describes a format for Angular Component libraries.

This project includes a build that produces a library based on the recommendation found here [Angular Package Format 4.0](https://goo.gl/AMOU5G). `npm run build:lib` supports AOT compile, treeshaking, and multiple bundlers. More more information, watch @jasonaden at ng-conf 2017 where presented a talk called [Packaging Angular](https://www.youtube.com/watch?v=unICbsPGFIA).

Boilerplate library files are found in `src/lib/`.


#### How do I take advantage of TypeScript in my IDE?

To take full advantage of TypeScript with autocomplete you would have to use an editor with the correct TypeScript plugins.


## Use a TypeScript-aware editor

We have good experience using these editors:

* [Visual Studio Code](https://code.visualstudio.com/)
* [Webstorm 11+](https://www.jetbrains.com/webstorm/download/)
* [Atom](https://atom.io/) with [TypeScript plugin](https://atom.io/packages/atom-typescript)
* [Sublime Text](http://www.sublimetext.com/3) with [Typescript-Sublime-Plugin](https://github.com/Microsoft/Typescript-Sublime-plugin#installation)


# License

[MIT](/LICENSE)
