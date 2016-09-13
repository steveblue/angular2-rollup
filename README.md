# angular2-rollup

[![Join the chat at https://gitter.im/angular2-rollup/Lobby](https://badges.gitter.im/angular2-rollup/Lobby.svg)](https://gitter.im/angular2-rollup/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

A complete, yet simple, starter for Angular 2 using AOT Compile and Rollup.

This repo serves as an Angular 2 starter for anyone looking to get up and running fast with Angular 2 and TypeScript and Ahead Of Time (AOT) compilation. We're using [ngc](https://github.com/angular/angular/tree/master/modules/%40angular/compiler-cli) for compiling AOT and [Rollup](http://rollupjs.org) for bundling our files for production. The development server compiles just in time (JIT) using Typescript and SystemJS for fast and efficient development.

`node` scripts written with [ShellJS](https://github.com/shelljs/shelljs) allow for cross platform support for the dev environment. A boilerplate [Express](http://expressjs.com) server is also included with support for livereload.

We're also using Protractor for our end-to-end story and Karma for our unit tests, however these tests are largely ported from this [Webpack Starter Code](https://github.com/preboot/angular2-webpack) and have yet to be fully tested in a development scenario. If you are interested in helping out, please contribute to this repository.

* Best practices in file and application organization for [Angular 2](https://angular.io/).
* Ready to go build system using [ngc](https://github.com/angular/angular/tree/master/modules/%40angular/compiler-cli) and [Rollup](http://rollupjs.org).
* Testing Angular 2 code with [Jasmine](http://jasmine.github.io/) and [Karma](http://karma-runner.github.io/).
* Coverage with [Istanbul](https://github.com/gotwarlost/istanbul)
* End-to-end Angular 2 code using [Protractor](https://angular.github.io/protractor/).
* Stylesheets with [SASS](http://sass-lang.com/)
* Error reporting with [TSLint](http://palantir.github.io/tslint/) and [Codelyzer](https://github.com/mgechev/codelyzer).

>Warning: Make sure you're using the latest version of Node.js and NPM

[Is Angular 2 Ready Yet?](http://splintercode.github.io/is-angular-2-ready/)

### Quick start

> Clone/Download the repo then edit `app.ts` inside [`/src/app/app.component.ts`](/src/app/app.component.ts)


#### clone the repo
`$ git clone https://github.com/steveblue/angular2-rollup my-app`

#### change directory to your app
`$ cd my-app`

#### install the dependencies with npm
`$ npm install`

#### Install the server config
$ See Configure Server section below.

#### Build, start the server and watchers
`$ npm start`

#### Optionally, set environment variables

`$ NODE_ENV=prod npm start`

#### In a second tab, start the Express Server

`$ node server`


# Table of Contents

* [Getting Started](#getting-started)
    * [Dependencies](#dependencies)
    * [Installing](#installing)
    * [Developing](#developing)
    * [Testing](#testing)
    * [Production](#production)
* [Frequently asked questions](#faq)
* [TypeScript](#typescript)
* [License](#license)

# Getting Started

## Dependencies

What you need to run this app:
* `node` and `npm` (Use [NVM](https://github.com/creationix/nvm))
* Ensure you're running Node (`v5.x.x`+) and NPM (`3.x.x`+)

## Installing

* `fork` this repo
* `clone` your fork
* `npm install` to install all dependencies

###Configure Server

Server configuration happens per environment. Currently two environments are supported: `dev` and `prod`. Create config files for each environment in the  `conf/` directory called `config.local.js` and `config.prod.js`. The files are listed in the `.gitignore` so they are not included in the repository.

The configuration file only takes two arguments for now: `origin` and `port`. `server.js` uses this configuration to initialize an Express Server either for development or production. Copy and paste the following to get started:

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

* `npm start && node server`
* `node server`

`build.js` will build the application for development. `server.js` will start a local server using Express and `liveserver` will watch for changes in the `/dist` directory.

## Testing

NOTE: Not 100% sure testing works, it was ported from another starter code project, [angular2-webpack](https://github.com/preboot/angular2-webpack). If you find issues or want to help build the testing suite out, please submit a Pull Request with bug fixes and feature requests.

#### 1. Unit Tests

* single run: `npm test`

#### 2. End-to-End Tests (aka. e2e, integration)

* single run:
  * in a tab, *if not already running!*: `npm start`
  * in a new tab: `npm run webdriver:start`
  * in another new tab: `npm run e2e`
* interactive mode:
  * instead of the last command above, you can run: `npm run e2e:live`
  * when debugging or first writing test suites, you may find it helpful to try out Protractor commands without starting up the entire test suite. You can do this with the element explorer.
  * you can learn more about [Protractor Interactive Mode here](https://github.com/angular/protractor/blob/master/docs/debugging.md#testing-out-protractor-interactively)

## Production

The production build is quite different than development. While the development server uses Angular Just In Time (JIT) compilation in conjunction with `tsc`, the production build uses [ngc](https://github.com/angular/angular/tree/master/modules/%40angular/compiler-cli) to compile the Angular 2 application Ahead of Time (AOT).

1. `ngc` has compiles the files in `/src` to `/tmp`,

2. Rollup bundles the files and their dependencies into `dist/bundle.es2015.js`.

3. Closure Compiler optimizes the bundle and outputs ES5 for the browser.

Since the bundle is still ES2015, we need to transpile the bundle into ES5. For this purpose, we tested multiple solutions and found the best option to either be Typescript (which failed after the update to RC.6) and Closure Compiler.

In order to build for production, you need to install [Closure Compiler](https://developers.google.com/closure/compiler/). Closure Compiler is the only tool that we found would transpile the ES2015 Rollup Bundle to ES5 with 100% reliability after it was processed with `ngc`. Closure Compiler is also a great solution because it optimizes the bundle and does code checking after Rollup tree shakes the application. Google uses Closure Compiler internally to optimize JavaScript files for production.

To run Closure Compiler, you need to install the [Java SDK](http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html) and the application file found [at the bottom of this page](https://developers.google.com/closure/compiler/). Rename the .jar file (ex: closure-compiler-v20160822.jar ) to `compiler.jar` and place it in `src/pubic/compiler.jar`. This file is in the .gitignore, which is why you have to manually install it. We tested the JavaScript version of Closure Compiler and found it resulted in `out of process memory` issues with multiple versions of `node`, which is why the Java application is necessary.

To build your application, run:

* `NODE_ENV=prod npm start`

You can now go to `/dist` and deploy that to your server!


# FAQ

#### Do I need to add script / link tags into index.html ?

Yes, as of right now this starter package will not handle this for you. The typical Angular 2 dependencies have been added already. Configure more dependencies to be included in your web app in `static.config.js`. A script runs that copies each dependency from `node_modules` into `/dist/lib` (or wherever you specify in the config). You can then reference the library in `src/public/index.html` like so:

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


#### How to include external libraries?

It's simple, just install the lib via npm, add the library to the build in `static.config.js` and inject the library via SystemJS in `src/public/system.config.js` and `index.html` for development and `src/public/system.config.prod.js` and `system.import.js` for production.


#### How do I bundle external libraries for production?

You can bundle external dependencies with Rollup. Out of the box there is support for projects that use ES2015 modules in `rollup.config.js`. For instance, we alias the ES2015 version of rxjs when bundling like so:

```
plugins: [
  alias({ rxjs: __dirname + '/node_modules/rxjs-es' }),
  replace({ 'ENVIRONMENT': JSON.stringify( 'production' ) }),
  resolve({ module: true }),
  cleanup()
]
```

A Rollup plugin does exist that will transform commonjs modules to ES2015 for the bundle called `rollup-plugin-commonjs` and it is included in package.json by default. If someone gets this working with the current build we'd love to see an example!

# TypeScript

> To take full advantage of TypeScript with autocomplete you would have to use an editor with the correct TypeScript plugins.

## Use a TypeScript-aware editor

We have good experience using these editors:

* [Visual Studio Code](https://code.visualstudio.com/)
* [Webstorm 11+](https://www.jetbrains.com/webstorm/download/)
* [Atom](https://atom.io/) with [TypeScript plugin](https://atom.io/packages/atom-typescript)
* [Sublime Text](http://www.sublimetext.com/3) with [Typescript-Sublime-Plugin](https://github.com/Microsoft/Typescript-Sublime-plugin#installation)

# License

[MIT](/LICENSE)
