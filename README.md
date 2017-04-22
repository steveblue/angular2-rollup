# angular2-rollup

[![Join the chat at https://gitter.im/angular2-rollup/Lobby](https://badges.gitter.im/angular2-rollup/Lobby.svg)](https://gitter.im/angular2-rollup/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

A complete, yet simple, starter for Angular 2 using AOT Compile and Rollup.


- `ngr --build dev` compiles just in time (JIT) using Typescript and SystemJS.

- `ngr --build prod` uses  [ngc](https://github.com/angular/angular/tree/master/modules/%40angular/compiler-cli) to compile ahead of time (AOT), bundles with [Rollup](http://rollupjs.org) and optimizes the build with [Closure Compiler](https://developers.google.com/closure/compiler/).

- `ngr --build lib` runs a build script for component libraries. It uses  [ngc](https://github.com/angular/angular/tree/master/modules/%40angular/compiler-cli) to make distributed components compatible with (AOT).

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

- Fork / Clone the repository

`$ git clone https://github.com/steveblue/angular2-rollup my-new-app`

- Change directory to app

`$ cd my-new-app`

- Install dependencies

```
$ npm install -g webdriver-manager rimraf
$ npm install
```

- To use the CLI

```
$ npm install -g
$ npm link
```

- Run development build, start up Express Server with LiveReload

`$ ngr --build dev --serve --watch`

When everything is setup correctly, you should be able to visit  [http://localhost:4200](http://localhost:4200) in your browser.




## Table of Contents

* [Getting Started](#getting-started)
    * [Dependencies](#dependencies)
    * [Installing](#installing)
    * [Developing](#developing)
    * [Testing](#testing)
    * [Production](#production)
* [CLI](#cli)
* [Frequently Asked Questions](#faq)
* [License](#license)




# Getting Started

## Dependencies

What you need to run this app:
* `node` and `npm` (Use [NVM](https://github.com/creationix/nvm))
* Ensure you're running Node (`v6.5.x`+)

## Installing

[Read the Quick Start](#quick-start)

### Configure Server

Change the host and/or port in `/conf/config.local.js` if needed. This config is used for the Express Server. `/conf/config.prod.js` is used for production, however we expect most teams to have a more sophisticated setup for production.

```
{
   origin: 'localhost',
   port: 4200
};

```

## Developing

After you have installed all dependencies you can now build the project:

* `$ ngr --build dev --watch --serve`

`build.env.js` will build the application for development for the appropriate environment. `chodikar` watches for changes in the `/build` directory, while another process spawns to start a local `Express` server. The development environment bootstraps Angular with JIT Compiler for fast and efficient development compared to AOT.

Once your work has been validated with the development build, you can also test the production build locally.

* `$ ngr --build prod --serve`


### Developing Component Libraries

At ng-conf 2017 Jason Aden gave a presentation about [Packaging Angular](https://youtu.be/unICbsPGFIA). It is recommended to follow the standard outlined in this presentation and in the doc [Angular Package Format 4.0](https://docs.google.com/document/d/1CZC2rcpxffTDfRDs6p1cfbmKNLA6x5O-NtkJglDaBVs/preview). To help engineers, this starter code provides a library build that makes bootstrapping the Angular Package Format fast and efficient.

Configure `build.config.js` with the path to the library and give the library build files a file name. You can develop Component libraries in the development environment.

```

lib: 'src/lib',
libFilename: 'default-lib'

```

When its time to build the Component Library so other projects can consume it, use the following command.

* `$ ngr --build lib`


## Testing


### 1. Unit Tests

* single run: `ngr --unit`

### 2. End-to-End Tests (aka. e2e, integration)

* single run:
  * in a new tab *if not already running!*: `npm run webdriver:start`
  * in a tab: `ngr --build dev --serve`
  * in a tab: `ngr --test`
* interactive mode:
  * instead of the last command above, you can run: `ngr --live`
  * when debugging or first writing test suites, you may find it helpful to try out Protractor commands without starting up the entire test suite. You can do this with the element explorer.
  * you can learn more about [Protractor Interactive Mode here](https://github.com/angular/protractor/blob/master/docs/debugging.md#testing-out-protractor-interactively)

## Production

While the development build uses Angular Just In Time (JIT) compilation in conjunction with `tsc`, the production build uses [ngc](https://github.com/angular/angular/tree/master/modules/%40angular/compiler-cli) to compile the Angular 2 application Ahead of Time (AOT). AOT is inherently more secure than JIT and should always be used in a production environment.

Here's how is works:

1. `ngc` compiles the files in `/src` to `/tmp`,

2. Rollup bundles the files and their dependencies into `build/bundle.es2015.js`.

3. Closure Compiler optimizes the bundle and outputs ES5 for the browser.

### Installation

In order to build for production, install [Closure Compiler](https://developers.google.com/closure/compiler/). Closure Compiler is the only tool that we found would transpile the ES2015 Rollup Bundle to ES5 with 100% reliability after it was processed with `ngc`. Closure Compiler is also a great solution because it provides further optimizations to the bundle after `ngc` and `Rollup` tree shakes the application. Google uses Closure Compiler internally to optimize JavaScript files for production.

To run Closure Compiler, you need to install the [Java SDK](http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html) and the application file found [at the bottom of this page](https://developers.google.com/closure/compiler/). Rename the .jar file (ex: closure-compiler-v20160822.jar ) to `compiler.jar` and copy it into the project root directory (`./compiler.jar`). This file is in the `.gitignore`, which is why you have to manually install it. We tested the JavaScript version of Closure Compiler and found it resulted in `out of process memory` issues with multiple versions of `node`, so we opted to use the `Java` implementation.

To build an application for production, run the following command.

* `$ ngr --build prod`

You can now deploy the `/build` folder to your server!

# CLI

This starter code includes a CLI that allows you to build and start up an Express Server without `npm run`. The CLI includes commands for generating new code snippets similar to Angular CLI.

To use the CLI run the command `npm install -g` while in the root directory of the project, then `npm link`. `webdriver-manager` should also be installed globally if it isn't already.

`npm install -g`
`npm link`

## CLI Commands

#### --help

Displays the help documentation for using `ngr`

#### --build

- `ngr --build dev --watch` Builds development environment, runs watcher
- `ngr --build prod` Builds production environment

NOTE: Use `-b` instead of `--build`

#### --generate

- `ngr --generate component --name todo-list --spec` Generate a `TodoListComponent` in the current directory with a spec file
- `ngr --generate directive --name todo-list --dir path/to/folder` Generate a `TodoListDirective` in a folder
- `ngr -g module -n todo-list -r` Generate a `TodoListModule` in a folder with a routes.ts file

NOTE: Use `-g` instead of `--generate`

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

EXAMPLE: `ngr --generate service --name todo-list --dir path/to/folder`

You can configure prefixes for Classes, Component and Directive selector in `build.config.js`. Omit the properties from the config to operate without prefixes. Defaults are included that follow the Angular Style Guide.

#### --serve

- `ngr --build dev --watch --serve` Builds development environment, runs watcher and starts up Express Server


# FAQ

## How do I include third party libraries?

Since the production build bundles the application, it is a best practice to tree shake and bundle third party libraries, however this process only works if the third party library is packaged with ES2015 modules.

`import Rx from "rxjs/Rx";`


While you could do this, it is a best practice to only import the methods of the library your app requires.

```
import "rxjs/add/observable/interval";
import "rxjs/add/operator/take";
import "rxjs/add/operator/map";
import "rxjs/add/operator/bufferCount"

```

If you import an entire library using `*` for instance, the entire library will be bundled in your application, so importing ONLY the methods your application requires is crucial for an optimal bundle.

`import` will only work with libraries packaged with ES2015 modules.

When bundling for production, you may need to also need to update the `rollup.env.js` file to properly bundle the third party library.


#### Typings

You may also need to inject `typings` for the `ngc` service to properly inject dependencies during AOT compilation.

```
"compilerOptions": {
  "typeRoots": [ "node_modules/@types" ],
  "types": [
     "node",
     "jquery"
  ]
}
```



#### Rollup Third Party Libraries

When your project requires third party libraries that are distributed with UMD modules, use `rollup-plugin-commonjs` to bundle the third party library.

```
import commonjs from 'rollup-plugin-commonjs';
...

plugins: [
  commonjs({
   include: 'node_modules/rxjs/**'
  })
]
```



#### Other Third Party Libraries

If a third party dependency cannot be imported with an `import` statement, you can configure library dependencies in `build.config.js`. A script runs during the build that copies each dependency from `node_modules` into `/build/lib` (or wherever you specify in the config). You can then reference the library in `src/public/index.html` like so:

```
    <script src="/lib/core-js/client/shim.min.js"></script>
    <script src="/lib/zone.js/dist/zone.js"></script>
    <!-- build:remove:prod -->
      <script src="/lib/reflect-metadata/Reflect.js"></script>
    <!-- /build -->
```


The typical Angular 2 dependencies are already included in the `<head>` tag in `index.html`. Comments like in the example above in `index.html` can also exclude certain portions of the file in particular builds.


You can also include third party dependencies with `SystemJS`.

```
<script>

   Promise.all([
      System.import('firebase'),
      System.import('app')
   ]);

</script>
```



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

You will need to update package.json with a new script to run for the new environment.

```
"build:env": "rimraf build && node build.env.js"
```

If you are duplicating the production build and renaming the environment, you will also have to create variants of the compile, bundle, and transpile scripts:

```
"compile:env": "ngc -p ./tsconfig.env.json",
"bundle:env": "rollup -c rollup.env.js",
"transpile:env": "java -jar ./compiler.jar --warning_level=QUIET --language_in=ES6 --language_out=ES5 --js ./build/bundle.es2015.js --js_output_file ./build/bundle.js",
```

Configuration for these services are in the specific files, while the configuration for Closure Compiler is found in the script itself.




## How do I update my project from the latest starter code?

If you alter configuration files or the `package.json`, then you will have to `diff` the files and make changes. If you duplicate the build you can avoid potential conflicts.

After you have finished updating the `package.json`, run the following command:

- `$ npm run clean:install`



## Can I run LiveReload with the Production build?

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


## How do I take advantage of TypeScript in my IDE?

To take full advantage of TypeScript with autocomplete you would have to use an editor with the correct TypeScript plugins.


#### Use a TypeScript-aware editor

We have good experience using these editors:

* [Visual Studio Code](https://code.visualstudio.com/)
* [Webstorm 11+](https://www.jetbrains.com/webstorm/download/)
* [Atom](https://atom.io/) with [TypeScript plugin](https://atom.io/packages/atom-typescript)
* [Sublime Text](http://www.sublimetext.com/3) with [Typescript-Sublime-Plugin](https://github.com/Microsoft/Typescript-Sublime-plugin#installation)


# License

[MIT](/LICENSE)
