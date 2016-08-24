# angular2-rollup

[![Join the chat at https://gitter.im/angular2-rollup/Lobby](https://badges.gitter.im/angular2-rollup/Lobby.svg)](https://gitter.im/angular2-rollup/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

**Note: This guide is following the Angular's [Style Guide](http://angular.io/styleguide)

A complete, yet simple, starter for Angular 2 using Rollup.

This seed repo serves as an Angular 2 starter for anyone looking to get up and running with Angular 2 and TypeScript fast. Using [Rollup](http://rollupjs.org) for building our files and assisting with boilerplate. We're also using Protractor for our end-to-end story and Karma for our unit tests. This starter code was ported from this [Webpack Starter Code](https://github.com/preboot/angular2-webpack). If you are interested in helping out, please contribute to this repository.

* Best practices in file and application organization for [Angular 2](https://angular.io/).
* Ready to go build system using [Rollup](http://rollupjs.org)) for working with [TypeScript](http://www.typescriptlang.org/).
* Testing Angular 2 code with [Jasmine](http://jasmine.github.io/) and [Karma](http://karma-runner.github.io/).
* Coverage with [Istanbul](https://github.com/gotwarlost/istanbul)
* End-to-end Angular 2 code using [Protractor](https://angular.github.io/protractor/).
* Stylesheets with [SASS](http://sass-lang.com/) (not required, it supports regular css too).
* Error reported with [TSLint](http://palantir.github.io/tslint/) and [Codelyzer](https://github.com/mgechev/codelyzer).

>Warning: Make sure you're using the latest version of Node.js and NPM

[Is Angular 2 Ready Yet?](http://splintercode.github.io/is-angular-2-ready/)

### Quick start

> Clone/Download the repo then edit `app.ts` inside [`/src/app/app.component.ts`](/src/app/app.component.ts)

```bash
# clone the repo
$ git clone https://github.com/steveblue/angular2-rollup-starter my-app

# change directory to your app
$ cd my-app

# install the dependencies with npm
$ npm install

# start the watchers (currently this task doesn't start the server)
$ npm start

#open a new terminal window and start live-server
& npm run dev:server

```
go to [http://localhost:4200](http://localhost:4200) in your browser.

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

## Developing

After you have installed all dependencies you can now build the project:

* `npm start`

Start the watchers with the following command:

* `npm run watch`

Then start the development server:

* `npm run dev:server`


It will start a local server using `live-server` and combined with `nodemon` will watch, build (in-memory), and reload for you. The application can be checked at `http://localhost:4200`.

## Testing

Not 100% sure testing works, it was ported from another starter code project. If you want to try it out and submit a Pull Request with fixes, pelase do so.

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

To build your application, run:

* `npm run build:dev`

You can now go to `/dist` and deploy that to your server!

The production build adds minification via Uglify.

* `npm run build:prod`


# FAQ

#### Do I need to add script / link tags into index.html ?

Yes, as of right now this starter package will not handle this for you but it is possible. The typical Angular 2 dependencies have been added for you and you can configure more in `static.config.js`. A script runs that copies each dependency into `/dist/lib` (or wherever you specify in the config). You can then reference the library in `index.html` like so:

```
    <script src="/lib/zone.js/dist/zone.js"></script>
    <script src="/lib/reflect-metadata/Reflect.js"></script>
```

NOTE: Entire dependency folders are copied from `node_modules` to `dist/lib`.


#### How to include external angular 2 libraries ?

It's simple, just install the lib via npm, import it into src/vendor.ts and then import in your code when you need it. Don't forget that you need to configure some external libs in the [bootstrap](https://github.com/steveblue/angular2-rollup/blob/master/src/main.ts) of your application.

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
