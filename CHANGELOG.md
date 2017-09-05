##5.0.0

MAJOR BREAKING CHANGES in this release.

- Updated to Angular 5.0.0
- CLI must now be installed globally `npm i -g angular2-rollup`
- Project dependencies are now decoupled from CLI dependencies
- Scaffold a new app with `ngr --scaffold`, with `--lib` for library builds
- CLI output has new look and feel in terminal
- Added ability to write custom builds easier
- Added build hooks so users can insert custom logic into parts of each build
- e2e spec files can now be generated with `ngr --generate e2e`
- Project dependencies are now decoupled from CLI dependencies


###MIGRATING from 4.3.6 to 5.0.0

Install the CLI globally. `npm install -g angular2-rollup`

Remove all build files except `build.config.js` unless you have made changes to the build.

-  build.dev.js
-  build.lib.js
-  build.prod.js
-  build.scaffold.js
-  build.utils.js

If you have changed the builds, it is recommended that you migrate any tasks to the new build hooks included with this update.

If a build has diverged significantly, you can include the build file in your local project and it will override the original. This is not recommended and results may vary.

Remove `cli.js`

Rename `./conf/config.local.js` to `./server.config.dev.js`
Rename `./conf/config.prod.js` to `./server.config.prod.js`

The only file referencing these files is `server.js`. Change the paths in the `require()` lines at the top of the file.

Update `package.json`

The necessary scripts in the `package.json` have been greatly reduced. Below is an example of the package.json shipped with 5.0.0. Remove any deprecated scripts.

```
"scripts": {
      "clean": "rimraf node_modules ngfactory doc build && npm cache clean",
      "clean:install": "npm run clean && npm install",
      "clean:build": "rimraf build",
      "clean:tmp": "rimraf tmp",
      "clean:ngfactory": "rimraf ngfactory && mkdir ngfactory",
      "copy:lib": "rsync -a --exclude=*.js ngfactory/ dist",
      "copy:package": "cp ./src/lib/package.json ./dist/package.json",
      "transpile:prod": "java -jar node_modules/google-closure-compiler/compiler.jar --warning_level=QUIET --language_in=ES6 --language_out=ES5 --js ./build/bundle.es2015.js --js_output_file ./build/bundle.js",
      "webdriver:update": "webdriver-manager update",
      "webdriver:start": "webdriver-manager start",
      "lint": "tslint --force \"src/app/**/*.ts\"",
      "e2e": "protractor protractor.config.js",
      "e2e:live": "protractor protractor.config.js --elementExplorer",
      "pretest": "",
      "test": "karma start karma.conf.js",
      "test:watch": "karma start karma.conf.js --no-single-run --auto-watch",
      "ci": "npm run e2e && npm run test",
      "ci:watch": "npm run e2e && npm run test:watch",
      "start": "ngr --build dev --watch --serve",
      "serve": "node server.js",
      "postinstall": "npm run webdriver:update"
    }
```

Update `@angular` dependencies in `package.json`

```
    "dependencies": {
      "@angular/animations": "5.0.0-beta.6",
      "@angular/common": "5.0.0-beta.6",
      "@angular/core": "5.0.0-beta.6",
      "@angular/forms": "5.0.0-beta.6",
      "@angular/http": "5.0.0-beta.6",
      "@angular/platform-browser": "5.0.0-beta.6",
      "@angular/platform-browser-dynamic": "5.0.0-beta.6",
      "@angular/platform-server": "5.0.0-beta.6",
      "@angular/router": "5.0.0-beta.6",

    "devDependencies": {
      "@angular/compiler": "5.0.0-beta.6",
      "@angular/compiler-cli": "5.0.0-beta.6",
      "@angular/language-service": "5.0.0-beta.6",
```




##4.3.6

- Updated to Angular 4.3.6
- Fixed issue in library build that prevented global CSS form compiling minified


##4.3.5

- Updated to Angular 4.3.5
- Deprecated `@types/core-js` and instead configured `compilerOptions.lib` for the dev build


##4.3.0

- Updated to Angular 4.3.0
- Updated RxJs to ~5.4.2 and TypeScript to ^4.2.0, included TypeScript fix in RxJs
- Fixed an issue that prevented the Express Server from running without LiveReload
- Production builds now include only the specific library files production requires instead of entire library packages
- Fixed an issue copying library files with deep directory structures
- Removed system.js polyfills from index.html because they were deprecated in the package

BREAKING CHANGES


The production build now requires a new Object in build.config.js with the property name `prodLib`.

```
    dep: {
        lib: [
            'angular-srcs/shims_for_IE.js',
            'core-js',
            'reflect-metadata',
            'zone.js',
            'systemjs',
            '@angular',
            'rxjs'
        ],
        prodLib: [
            'angular-srcs/shims_for_IE.js',
            'core-js/client/shim.min.js',
            'core-js/client/shim.min.js.map',
            'systemjs/dist/system.js',
            'zone.js/dist/zone.js'
        ]
```


##4.3.0-beta.0

- Updated to Angular 4.3.0-beta.0
- Updated packages to latest compatible versions
- Commented and cleaned up build scripts
- PostCSS now defaults `autoprefixer` to `last 20 versions` for better IE support

BREAKING CHANGES

- postcss-cli config files must be migrated from pre 2.6.0 format to post 2.6.0 format

EXAMPLE:

BEFORE:

```
{
    "use": ["autoprefixer"],
    "local-plugins": true,
    "autoprefixer": {
        "browsers": "> 5%"
    }
}

```

AFTER:

```
module.exports = {
  plugins: {
    'autoprefixer': {
        browsers: '> 5%'
    }
  }
}

```

NOTE: Only the Object format is supported currently NOT the Array format. The build tools will parse the Object properties for the `--use` option.

For more information: https://github.com/postcss/postcss-cli/wiki/Migrating-from-v2-to-v3




----------------------------------------------------------------------------------------------------


##4.2.0

- Updated to Angular 4.2.0
- Fixed issue when updating global SASS, livereload and CSS would not update when editing certain files
- Fixed an issue when users move library build to another location
- Updated library build, ES5 and UMD builds are now correctly transpiled
- Updated support for external libraries, now you can specify single file instead of just folders
- Updated boilerplate to support IE9

----------------------------------------------------------------------------------------------------

##4.0.3

- Updated to Angular 4.0.3
- New CLI commands, run `npm i -g` to use in your project
- Revised README

```
  $ ngr --help

  Usage: ngr <keywords>

  Options:

    -h, --help             output usage information
    -V, --version          output the version number
    -b, --build [env]      Build the application by environment
    -w, --watch [bool]     Enable file watchers to detect changes and build
    -g, --generate [type]  Generates new code from templates
    -n, --name [string]    The name of the new code to be generated (kebab-case)
    -f, --force [bool]     Force overwrite during code generate
    -d, --dir [path]       Path the code should be generated in (relative)
    -s, --spec [bool]      Include spec files in code generation
    -r, --route [bool]     Include route files in code generation
    -t, --test [bool]      Run unit tests
    --serve [bool]         Run Express Server

```

----------------------------------------------------------------------------------------------------

##4.0.2

- Updated to Angular 4.0.2

----------------------------------------------------------------------------------------------------

##4.0.1


- Updated to Angular 4.0.1
- Added more configuration to `build.config.js`, renamed from `paths.config.js`
- Added new `lib` build for distributing libraries in ES6 and ES5
- Refactored build process to default to `build` folder, `dist` is now the default for library files
- Use `npm run build:dev` instead of `npm start` for development server
- Added `npm run build:prod` for AOT production builds
- Added `npm run build:lib` for building library files
- Use `watch=true` to watch prod and lib builds, disabled by default
- Fixed watcher in dev and prod modes, will now detect css changes properly
- Fixed an issue in prod build that could cause it to fail after libsass and PostCSS
- Added documnetation for running livereload and watcher with `npm run build:prod`
- Updated README
- Created CHANGELOG


To Upgrade `build.config.js`:

1. Move the `dep` Array to `dep.lib` and `src` to `dep.src`, `dist` to `dep.dist`.

BEFORE:

```
module.exports = {
    dep: [
            'core-js',
            'reflect-metadata',
            'zone.js',
            'systemjs',
            '@angular',
            'rxjs'
        ]
    },
    src: './node_modules',
    dist: './dist/lib'
}
```

AFTER:

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
        src: './node_modules',
        dist:  './build/lib'
    }
}
```

2. Add the project `src`, `build`, and `dist` (optional) directories. These properties point to the source directory, the folder the project should be built in, and in the case of a distributing a library, the `dist` that will be used by other projects.

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
        src: './node_modules',
        dist: './build/lib'
    },
    clean:{
      files:[],
      folders:[]
    },
    src: 'src',
    build: 'build',
    dist: 'dist',
    lib: 'src/lib',
    libFilename: 'default-lib'
}

