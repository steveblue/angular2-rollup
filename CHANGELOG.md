# 2.0.2

- UPDATE running ngr in non angular-rollup project will display error in console once again
- FIXED issue that caused libraries to scaffold with incorrect path to es5 bundle
- FIXED issue that caused scoped packages to build without proper importAs property in metadata.json
- FIXED issue that prevented production build when building rxjs FESM

-------------------------------------------------------------------------------------------------------------

# 2.0.1

- UPDATE scaffold for @angular packages > 7.0.0
- UPDATE production and library builds to support `.scss` filenames in `component.ts` files
- UPDATE production build to support css only
- FIXED issues in library build when using `.css` files instead of `.scss`

NOTE: In this release we made it possible to develop easier with `@angular/cli` yet still build for production with `ngr build prod`. The existing development build still works, but it is highly recommended to use `ng serve` for development when possible instead of `ngr build dev`. If you have been developing off `angular/rollup`, upgrading to take advantage of `ng serve` is relatively simple. Update all references to `.css` files in your `component.ts` files to `.scss`. Now your application should run fine in `@angular/cli` for development and the `angular-rollup` production build will still honor SCSS for production.

-------------------------------------------------------------------------------------------------------------

# 2.0.0

angular-rollup 2.0.0 delivers the same cli as 1.x with more powerful builds and integration with @angular/cli!

- NEW integration with @angular/cli means you can run familiar commands in same project
- NEW configuration means less files in root directory
- NEW asynchronous build scripts deliver faster build times
- NEW ability to work with several libraries in the same project
- NEW logging mechanism destroys the log on every message
- NEW pretty printed error logs in Terminal with direct links to VS Code
- NEW ability to scaffold a project with prettier installed
- NEW ability to scaffold a project with SSL enabled in development server
- NEW ability to migrate an application generated with @angular/cli to angular-rollup
- NEW production build is even more optimal with inclusion of Angular Build Optimizer
- NEW scaffold a new project with Angular IVY preconfigured
- NEW stacktraces when ngr fails allowing for more better error reporting
- NEW `--env` argument mirrors the way @angular/cli handles environments
- NEW build hooks for development build allow you to watch changes in `src` or `dist` in `ngr.config.js`
- NEW production build concatenates all vendor scripts into `vendor.js` cutting down network requests
- UPDATED postcss to > 5.0.0, including new configuration with the postcss-cli
- UPDATED `--rollup` argument will bundle with Rollup like before but now optimizes with Closure Compiler in ADVANCED_OPTIMIZATIONS
- DEPRECATED `build` directory, all builds are now output to `dist` by default comparable to @angular/cli
- DEPRECATED the ability to scaffold an Angular Universal application. This feature will return soon!
- DEPRECATED the ability to lazyload with Closure Compiler. This feature will return soon!
- DEPRECATED main.ts. The build now uses the main.ts provided by @angular/cli
- DEPRECATED unit / e2e testing scripts, use @angular/cli instead
- DEPRECATED i18n tooling, use `@angular/compiler-cli` directly instead


### UPDATING from 1.x to @angular/cli

To migrate an application running on angular-rollup 1.x or @angular/cli, the best option is to scaffold a new app with the old source.

```
ngr new my-new-app --src /path/to/old/src
```

This will migrate the src directory as well as all config from the old project to a new directory. Old configuration files will be renamed `.bak` so you can compare old files against the new configuration.


### ROADMAP

These tasks didn't make the 2.0.0 release but are items I really want to include in future releases!

- Scaffold Angular Universal application
- Scripts for codesplitting an application to optimize lazy loaded bundles with Closure Compiler
- Generate Bazel configuration in the project
- Support for LESS, Stylus, CSS only workflows


-------------------------------------------------------------------------------------------------------------


## 2.0.0-rc.8

- FIXED issue with generating libraries in Windows

-------------------------------------------------------------------------------------------------------------

## 2.0.0-rc.7

- FIXED issue that prevented production build from working in Windows
- FIXED issue that could potentially prevent scaffolding a new app
- FIXED issue in library build that prevented production css from being deployed

-------------------------------------------------------------------------------------------------------------

## 2.0.0-rc.6

- NEW `--ivy` argument scaffolds a new app setup for angular ivy
- UPDATE `--angularVersion` argument scaffolds app with a specific angular version
- FIXED issue with sourcemaps when using `--env` in dev build

-------------------------------------------------------------------------------------------------------------

## 2.0.0-rc.5

- FIXED issues with `--env` in development build
- FIXED issue that didnt set the environment by default to `prod` in prod build
- UPDATE main.ts to compile using module and target from tsconfig

-------------------------------------------------------------------------------------------------------------

## 2.0.0-rc.4

- NEW `--prettier` argument to scaffold a new app with prettier and installs a precommit hook
- NEW `--ssl` argument to scaffold a new app with https express server
- DEPRECATED main.ts, use @angular/cli supplied src/main.ts instead
- FIXED issue that prevented library build from compiling global sass

NOTE: Running the https express server requires a public key and certificate. Generate `key.pem` and `cert.pem` and save in the `backend` directory.

-------------------------------------------------------------------------------------------------------------

## 2.0.0-rc.3

- BREAKING CHANGE ngr.config.js must be updated to latest schema to support multiple projects in the same build
- NEW projects in ngr.config.js mirrors @angular/cli handling of multiple projects
- NEW cli command for library build allows user to leave out --config cli argument
- FIXED issue that caused error messages to hang in console after TypeScript compiles without errors
- FIXED issue that caused some errors not to produce a stacktrace
- FIXED issue that caused library builds to not export css properly
- FIXED issue that caused new projects to not replace the `<title>` tag properly
- FIXED issue when logging library builds without any global styles
- FIXED issue that caused node > 9.0.0 to display SIGNIT error message
- FIXED issue that prevented dev build from displaying stats at end
- UPDATE package to support >8.0.0 <10.0.0

NOTE: This version contains breaking changes due to the new addition of projects in `ngr.config.js`.

To migrate an existing src directory:

`ngr new my-new-app --src /path/to/old/src`

-------------------------------------------------------------------------------------------------------------

## 2.0.0-rc.2

- NEW spinners and emojis in logs
- FIXED several issues with logs including output in VS Code
- FIXED issue that prevented app from scaffolding
- FIXED potential issues from files not being copied from existing @angular/cli project

-------------------------------------------------------------------------------------------------------------

## 2.0.0-rc.1

- NEW migrate a `@angular/cli^6.0.0` project to `angular-rollup`
- NEW generate a library with `ngr generate library lib-name` in any project directory
- FIXED issues with watcher when running `ngr build dev --watch`
- FIXED issues when running `ngr new`
- UPDATE CHANGELOG.md with RC changes

-------------------------------------------------------------------------------------------------------------

## 2.0.0-rc.0

- NEW `--rollup` and `--webpack` arguments for `ngr build prod`
- NEW Rollup build optimizes with Closure Compiler in ADVANCED_OPTIMIZATIONS
- NEW buildHooks in dev build for watching filesystem changes
- NEW postcss.config.js configuration to match the latest postcss-cli@5.0.0
- NEW environment variables, uses same `--env` argument as `@angular/cli`
- NEW README.md details changes in the angular-rollup project
- NEW `out-css` directory in root stores temporary sass output
- NEW production build concatenates vendor files in `vendor.js`
- NEW `--src` property will migrate `src` and config from existing angular-rollup projects to help in the upgrade process
- NEW integrate Angular Build Optimizer in production builds
- FIXED several issues with @angular/cli integration
- FIXED several issues when configuring postcss plugins
- FIXED issues with sass compile when the file contains underscore
- FIXED several issues with logs
- CHANGE removed duplicate config in `ngr.config.js`, now defaults to `angular.json`
- DEPRECATED build folder, now builds are output in `dist/{{projectName}}`


UPDATE

The easiest way to update an existing angular-rollup project is to create a new application and migrate the existing config and src.


BREAKING CHANGE
- REMOVE config/postcss.*.js and convert to `postcss.config.js` with environment variables

TIP

Configure your `tsconfig.json` to `exclude` the new `out-tsc` and `out-css` directories.


FILESYSTEM WATCHER

In `ngr.config.js` you can listen for changes in the `src` or `dist` folders and do something on change.

```
module.exports = {
    buildHooks: {
        dev: {
            post: () => {
                spawn('node_modules/.bin/rollup', ['-c', 'rollup.config.dev.js'],
                    { stdio: 'inherit', shell: true });
            },
            watch: {
                dist: (filePath) => {
                    if (!filePath.includes('bundle.js') &&
                         filePath.includes('.js')) {
                        spawn('node_modules/.bin/rollup', ['-c', 'rollup.config.dev.js'],
                            { stdio: 'inherit', shell: true});
                    }
                }
            }
        },
```
-------------------------------------------------------------------------------------------------------------

## 2.0.0-beta.3

This release marks a monumental shift in strategy for the angular-rollup project. Instead of being a standalone cli, `ngr` can now be used in tandem with `ng` commands from the `@angular/cli` project. This was possible before, but only if both projects were manually merged together. 2.0.0-beta.3 scaffolds new applications with `@angular/cli` by default then merges its config with `angular-rollup`. The new `ngr merge` command will copy files needed by `ngr` into an existing `@angular/cli` project.

The downside to this approach is now you must maintain a Webpack config and the config for angular-rollup. The advantages far outway the disavantages. Now you have access to `ng upgrade`, scaffolds, and all the wonderful tooling provided by `@angular/cli`.

In order for both `ng` and `ngr` to coexist, it currently requires the following:

- The project must use SCSS or SASS for styling
- Assets must be stored in `src/public/assets` not `src/assets`
- favicon.ico must be located in `src/public/favicon.ico` not `src/favicon.ico`

angular-rollup will not respect public files in the src folder. Public files must be stored in src/public.

angular-rollup now defers to `@angular/cli` for unit and e2e test configurations. If you used the previous test config you may still do so, but it will not be supported in future scaffolds. It is recommended to use `ng test` instead.

If you want angular-rollup to support LESS, Stylus, PostCSS without SASS or just plain CSS please submit a PR with the necessary changes. This support is currently in the backlog and help would be appreciated to make it happen.

CHANGES

- New apps are scaffolded with `@angular/cli` and then merged with `angular-rollup`
- Scaffold a new app with an existing src
- `ngr merge` in existing `@angular/cli` project will copy over necessary files for `angular-rollup`
- `--no-install` flag has changed to `--skip-install` for the scaffold command


BREAKING CHANGES

- tsconfig.dev.json, tsconfig.prod.json, and tsconfig.jit.json have moved to src folder
- angular-rollup now defers to `@angular/cli` for unit and e2e test configuration


To update an existing app built with angular-rollup, it is best to scaffold a new app, then move the files into the old repo.

`ngr scaffold my-new-app --skip-install --src path/to/old/src`

Then compare package.json and ngr.config.json with the existing files, make necessary changes, then run `npm install`.

-------------------------------------------------------------------------------------------------------------


## 2.0.0-beta.2

- Fixed an issue that prevented the user from reading SASS or PostCSS error messages in --watch mode
- Styled errors produced by Closure Compiler

-------------------------------------------------------------------------------------------------------------

## 2.0.0-beta.1

- Support Angular 6.0.0-rc. Apps scaffolded in 2.0.0 will default to 6.0.0 once it is released.
- Support building libraries with Package Format 6.0
- Moved configuration files for library packages to config directory to clean up source
- Fixed issue that prevented logs from displaying libraries that are copied
- Resequenced development build making it faster for large scale projects
- Development build doesnt clean build folder by default, use --clean flag when coming from prod build
- Streamline file copy tasks
- Fix issue preventing files in public directory from being copied in --watch mode

-------------------------------------------------------------------------------------------------------------

## 2.0.0-beta.0

- All new build architecture allows for easier maintainance, human readibility
- 4x faster builds in some cases
- Fixed an issue that prevented styles from compiling in library builds


### IMPROVEMENTS

- Add `src/style/**/*.scss` and `src/style/**/*.css` to `excludes` Array in tsconfig.dev.json. This will force ngc to ignore global styles and prevent compilation. Updates to global styling can now happen without browser reload.
- Deprecated requirement for Babel in library build

### BREAKING CHANGES

- `main.js`, `main.prod.js` and `main.prod.ts` are now deprecated. These files can be removed. The build now automatically handles `main.ts` for dev and jit builds.
- Upgrade `rollup` to `^0.55.0`. The library build now supports `input` and `output` syntax by default
- Arguments passed to buildHooks and server.js may change, please check and update where necessary

For example, in previous scaffolds `server.js` contained this conditional checking for `--watch` but `canWatch` supposes there is an `=`. In 2.0.0 only `watch` is exposed, not anything after the `=`:

BEFORE:

```
  if (arg.includes('watch')) {
    canWatch = arg.split('=')[1].trim() === 'true' ? true : false;
  }
```

AFTER:
```
  if (arg.includes('watch')) {
    canWatch = true;
  }
```

- Change the model for declaring library packages in `ngr.config.js`. The new config should look like this:

BEFORE:

```
dep: {
    lib: [],
    prodLib: []
}

```

AFTER:
```
lib: {
    dev: [],
    prod: []
}

```

-------------------------------------------------------------------------------------------------------------

## 1.0.8

- Fixed issue that prevented post buildHook from firing in dev build
- Fixed timing issues when logging the dev build

-------------------------------------------------------------------------------------------------------------


## 1.0.7

- Added --env argument for build command
- Added rxjs/Subscription to default paths mapped in system.config.js

In this release, angular/rollup will pass an environment variable to process.argv. Below is an example of how you could use environment variables with a pattern similar to @angular/cli with ngr.config.js. `angular-rollup` gives you control over how you implement environment variables. Copy the current environment file into the src/app folder or any other folder you desire so it can be imported into source code.

```
buildHooks: {
        prod: {
            pre: (argv) => {
                var env = argv.find(a => a.includes('env')).split('=')[1];
                return new Promise((res, rej)=>{
                    cp('environments/environment.'+env+'.ts', 'src/app/environment.ts');
                    res();
                });
            }
        }
}
```

-------------------------------------------------------------------------------------------------------------

## 1.0.6

- Fixed issue with lazy build when angular library package name contains special character
- Fixed logs with production build when closure compiler fails
- Fixed warnings during ngr scaffold

-------------------------------------------------------------------------------------------------------------

## 1.0.5

- Enhanced build logs with duration of the build inspired by Parcel
- Fixed several issues with logs
- Fixed an issue when global scss filenames began with underscore
- Fixed an issue when generating a library with a custom source name defined in ngr.config.js

-------------------------------------------------------------------------------------------------------------

## 1.0.4

- Remove version message unless the user needs to update

-------------------------------------------------------------------------------------------------------------

## 1.0.3

- Support for building an app for production using Angular Universal. `ngr build prod --universal`.
- Scaffold a new app with Angular Universal support by using the `--universal` flag with `ngr scaffold`. Currently also requires `--rollup` to bundle the production build.
- Added support for i18n localization in production and Universal builds
- Added `--tsConfig --rollupConfig --template` options to `ngr build`, allows you to test different config with the current build without overwriting a stable config
- Fixed issues when user changes the src directory to another folder, useful when coding Angular Universal project
- Single line logging output
- Tested builds with node 8.x


```
ngr scaffold --universal
ngr build prod --universal --serve

```

The universal build overwrites the dist folder and creates the following file/folder structure for deployment to production.

```
dist/frontend
dist/backend
package.json
server.universal.js
```

-------------------------------------------------------------------------------------------------------------

## 1.0.2

- Fixed issues with build scripts when certain @angular package versions are in package.json
- Fixed an issue that prevented `lazy.config.json` from being deployed to build folder when using `ngr build dev`
- Fixed an issue that prevented library UMD and ES5 builds from working properly in the browser
- Defaulted new projects to @angular ^5.0.0
- Removed bogus script from `package.json`

-------------------------------------------------------------------------------------------------------------

## 1.0.1

- Fixed an issue that prevented library from being injected in another app because paths to typings were incorrect

To migrate an existing library, simply change the `baseUrl` property in the tsconfig files to "./src" and move all library files into `path/to/lib/src`, update paths in your `index.ts`.

-------------------------------------------------------------------------------------------------------------

## 1.0.0

- Version bump
- Update README

-------------------------------------------------------------------------------------------------------------

## 1.0.0-rc.6

- Updated protractor config to latest
- Fixed issue that caused dev build to double compile on scss changes. Use `--postcss true` if you need to compile dev to test in older browsers.
- Fixed issue in e2e test template when using `ngr generate`
- Fixed typo in README regarding e2e testing
- Fixed issue that could prevent lazy.config.json from being copied correctly in prod build
- Added yarn to install messaging because why not?
- Added Web Animations polyfill to default configuration

-------------------------------------------------------------------------------------------------------------

## 1.0.0-rc.5

- Deprecated `build.config.js` in favor of namespaced file, new scaffolded apps default to `ngr.config.js`
- Cleaned up default `ngr.config.js` to include the bare minimum
- Removed dependency on npm registry, builds can run free of internet connection
- Removed unnecessary dependencies in package.json that had accumulated over course of development
- Updated README to include correct directions for running unit tests
- Removed selenium webdriver postinstall step from package.json
- Fixed typos in logs and comments in cli build scripts
- Use `postcss-csso` instead of `css-nano` for new scaffolded apps to fix possible bugs with z-index

If you wish you migrate to `ngr.config.js` rename the `build.config.js` file (`mv build.config.js ngr.config.js`) and update references to `build.config.js` in `server.js` and `router.js`. The build scripts will continue to check for build.config.js until we choose to deprecate backwards compatibility in a later release.

-------------------------------------------------------------------------------------------------------------

## 1.0.0-rc.4

- Add `ngr.config.js` file to root of any existing project to use cli commands. This file can be empty. This feature allows library builds in an existing app.
- Removed `rollup.config.json` from default scaffold, use `ngr scaffold --rollup` flag to get it back
- Added option to scaffold without the Express server, use `ngr scaffold --server false`
- Added option to scaffold a bare bones application, use `ngr scaffold --bare`
- Deprecated `cli.config.js`, builds now reference `ngr.config.js` or `build.config.js`
- Deprecated `jsconfig.json`
- Update README with instructions for `ngr.config.js` and using buildHooks in `build.config.js`

-------------------------------------------------------------------------------------------------------------


## 1.0.0-rc.3

- Fixed an issue that caused library config to generate with incorrect path
- Updated default paths in library configuration to conform to Package Spec 5.0
- Fixed an issue that could cause modules to not be generated when using `ngr generate module`
- Fixed an issue that could prevent global stylesheet from being generated in dist folder
- Updated README

-------------------------------------------------------------------------------------------------------------


## 1.0.0-rc.2

- Added method to generate a library package
- Added cli commands to generate unit tests for components and directives
- Added unit test generation to the wizard
- Fixed an issue with `system.config.js` that prevented rxjs from being currently mapped in dev mode
- Fixed an issue that would cause warnings when trying to run `ngr update --lib`. This argument will be deprecated in a future release, Use `ngr generate lib` instead.

Generate the configuration required for library packages with `ngr generate lib` or use `ngr generate wizard`.

`ngr generate lib --name my-lib --dir src/app/shared/lib`

After you have generated some components for the library, use `ngr build lib` to build the library in the `dist` folder.

`ngr build lib -c src/app/shared/lib/lib.config.json`

Generate a unit test either use the wizard (`ngr generate wizard`) or use the following examples as a guide.

`ngr generate unit --dir src/app/shared/components/my-component --name my-component`

Optionally, generate a unit test for a directive with the --spec argument.

`ngr generate unit --dir src/app/shared/components/my-component --name my-directive --spec directive`

-------------------------------------------------------------------------------------------------------------


## 1.0.0-rc.1

- `ngr build lib` now accepts `--config` argument, can point to a JSON configuration for library packages
- Fixed an issue that caused `es2015` code to be bundled with the `umd` library
- Fixed an issue that caused sourcemaps to be emitted with css in components packaged with the library build
- Added sourcemaps for `es5` and `umd` bundles
- Deprecated `copy:package` field in package.json and automated this command
- Fixed syntax highlighting in the CHANGELOG

This release includes a huge upgrade for library builds that allows multiple packages to be deployed from the same application. This change does not effect existing configuration and should be fully backwards compatible.

A new configuration file will be autogenerated when scaffolding a library. The JSON looks like this:

```
{
    "src": "src/app/shared/lib",
    "dist": "dist",
    "filename": "default-lib",
    "es2015": {
      "tsConfig": "tsconfig.lib.json",
      "rollupConfig": "rollup.config.lib.js",
      "outFile": "dist/default-lib.js"
    },
    "es5": {
      "tsConfig": "tsconfig.lib.es5.json",
      "rollupConfig": "rollup.config.lib-es5.js",
      "outFile": "dist/default-lib.es5.js"
    },
    "umd": {
      "tsConfig": "tsconfig.lib.es5.json",
      "rollupConfig": "rollup.config.lib-umd.js",
      "outFile": "dist/bundles/default-lib.umd.js"
    }
}
```

This JSON should be a sibling to the library's `package.json`.

The following files can be migrated to the root folder of a library package.

- `tsconfig.lib.json`
- `tsconfig.lib.es5.json`
- `rollup.config.lib.js`
- `rollup.config.lib-umd.js`
- `rollup.config.lib-es5.js`

The paths in `tsconfig` files will have to be updated to be relative to the root directory. The library build still uses `tmp` and `out-tsc` folders in the root project directory during the build phase.

Here is an example:

```
  "compilerOptions": {
    "baseUrl": ".",
    "rootDir": "../../../../tmp",
    "outDir": "../../../../out-tsc",

    ...

     "files": [
         "../../../../tmp/index.ts"
      ],

```

You can now use the `--config` argument to build a library package like so:

`ngr build lib -c src/app/shared/lib/lib.config.json`

This of course brings the added benefit of developing multiple library packages in the same application. Before, developers were limited to one library package per application since the build was bound to the configuration found in `build.config.js`. The new format allows secondary entry points to be compiled, per the Package Format spec. This older config should still work, but it is recommended to update to this latest format to ensure future compatibility.

-------------------------------------------------------------------------------------------------------------


## 1.0.0-rc.0

- Version bump
- Update README

-------------------------------------------------------------------------------------------------------------

## 1.0.0-beta.13

- Use `ngr update --angularVersion 5.0.0` for help updating an existing scaffolded app to Angular 5.0.0

-------------------------------------------------------------------------------------------------------------

## 1.0.0-beta.12

- Support for Angular 5.0.0
- `ngr scaffold` now defaults to a single bundle, use `--lazy` to bootstrap with lazyloaded routes, `--dynamicRoutes` is the same
- Added EXPERIMENTAL support for Electron. Scaffold a new app with `ngr scaffold --electron` then build with `--electron` argument. electron must be installed with `npm i -g electron`.
- Added `--remote` argument to production build. Allows a client to build from a host closure manifest `main.prod.MF`
- Fixed an issue that prevented files in src/public from properly being copied to build
- Fixed an issue where .gitignore may not be copied when app is scaffolded
- Fixed an issue that prevented livereload when changing a SASS file while using AOT in --watch mode
- Added preCompile and postCompile hooks into prod build
- pre, preCompile, and postCompile functions in `build.config.js` must return a Promise i.e.

```
    buildHooks: {
        jit: {
            pre: () => {
                return new Promise((res, rej) => {
                    // do something like copy files into /src
                    res();
                })
            }
        }
    }
```

For a client to utilize the new `--remote` flag and build a lazyloaded module from a host module, the host must provide a package for the client that includes:

- out-tsc files that were bundled in the host's `bundle.js`, listed in the host's `main.prod.MF`
- `bundle.js` and `bundle.js.map` files to be used in the client's index.html for testing against the production bundle
- `main.prod.MF`

The client must then copy the host's `out-tsc` files into `/out-tsc` during the `postCompile` build step.
The client must also copy the host's `main.prod.MF` into `/closure` during the `postCompile` build step.
The client must copy `bundle.js` and `bundle.js.map` into the `/build` directory in the `post` build step.

Here is an example of doing this with the buildHooks:


```
    buildHooks: {
        prod: {
            preCompile: function (args) {

                let isRemote = false;
                args.forEach((arg) => {
                    if (arg.includes('remote')) {
                        isRemote = arg.split('=')[1].trim() === 'true' ? true : false;
                    }
                });
                return new Promise((res, rej) => {
                    if (isRemote) {
                        mkdir('remote');
                        cp(path.normalize('./path/to/host/files'), path.normalize('./remote'));
                        res();
                    } else {
                        res();
                    }

                });
            },
            postCompile: function (args) {

                let isRemote = false;
                args.forEach((arg) => {
                    if (arg.includes('remote')) {
                        isRemote = arg.split('=')[1].trim() === 'true' ? true : false;
                    }
                });
                return new Promise((res, rej) => {
                    if (isRemote) {
                        cp(path.normalize('./remote/main.prod.MF'), path.normalize('./closure/main.prod.MF'));
                        cp('-R', path.normalize('./remote/out-tsc/*'), path.normalize('./out-tsc/'));
                        res();
                    } else {
                        res();
                    }

                });
            },
            post: function(args) {
                let isRemote = false;
                args.forEach((arg) => {
                    if (arg.includes('remote')) {
                        isRemote = arg.split('=')[1].trim() === 'true' ? true : false;
                    }
                });
                if (isRemote) {
                    cp(path.normalize('./remote/bundle.js'), path.normalize('./build/bundle.remote.js'));
                    cp(path.normalize('./remote/bundle.js.map'), path.normalize('./build/bundle.remote.js.map'));
                }
            }
        }
    }
```


-------------------------------------------------------------------------------------------------------------


## 1.0.0-beta.11

- Added first argument to all buildHooks callbacks in `build.config.js` that allows user to do something based on process.argv
- Fixed issue with scaffolding an app that prevented initial build
- Fixed issue in library build that prevented files from properly being copied
- Fixed logging errors in jit build
- Fixed an issue that prevented the library build from distributing css


-------------------------------------------------------------------------------------------------------------

## 1.0.0-beta.10

This update includes the remaining major new features for 1.0.0. Leading up to 1.0.0 this project will primarily be targeting bugfixes and improvements to support @angular 5.0.0.

This update includes several improvements to scaffolding and updating apps. Both scripts now warn you that files will be overwritten. if you try to scaffold an app over an existing app or update files that already exist. The `ngr update` command includes a helper argument (`--cliVersion`) to track changes necessary in boilerplate files when updating. Also found in this version is a new `--dynamicRoutes` option for scaffolding that allows for a dynamic route configuration on bootstrap. More concise log messages and better error reporting in the terminal are packaged with this release. The largest change to the production build is that closure Compiler is now the default bundler when running `ngr build prod`.

- `--closure` is now the default production build, use `ngr build prod --rollup` to bundle with Rollup instead
- Refactored boilerplate `index.html`, `system.import.js`, and `system.config.prod.js` to support lazyloaded bundles
- New `--dynamicRoutes` option available for scaffold and update, will scaffold app with support for configurable routes prior to bootstrap
- New argument for update `--cliVersion` will attempt to update existing boilerplate, but will not overwrite existing files
- New configuration file `lazy.config.json` provides model for automating Closure Compiler and SystemJS polyfill for lazyloaded bundles
- Prevented overwriting of project files when user repeats `ngr scaffold` or `ngr update`
- Moved the SystemJS polyfill into `system.polyfill.js`. This script requests `lazy.config.json`, uses a polyfill for SystemJS to map lazyloaded bundles. This config file is only necessary for the `--lazy` build.
- Condensed log messages for build scripts. Use `--verbose` to print more verbose messages
- Fixed issue with Closure Compiler that prevented `bundle.js` from being created
- Improved error reporting across the builds by adding new warnings, specific messages to help fix issues
- Third party libraries (externs) that are specific to a lazyloaded bundle can be bundled but not mangled by ADVANCED_OPTIMIZATIONS when configured in `lazy.config.json`
- Fixed issues with `--lazy` build when two or more lazyloaded bundles shared dependencies with the main bundle
- Fixes an issue with `--lazy` build when declaring externs in `closure.externs.js`

To update:

$`npm install -g angular-rollup@latest`

In the project directory:

$`ngr update --angularVersion 4.4.4 --cliVersion 1.0.0-beta.10`
$`npm install`


### ngr update --cliVersion

```
$ ngr update --cliVersion 1.0.0-beta.10
[13:17:07] LOG Review changes to angular-rollup in the CHANGELOG (https://github.com/steveblue/angular2-rollup/blob/master/CHANGELOG.md)
[13:17:07] LOG lazy.config.json copied to /Users/steveb/www/4-test/
[13:17:07] LOG system.polyfill.js copied to /Users/steveb/www/4-test/
[13:17:07] WARN src/public/system.import.js already exists
[13:17:07] WARN src/public/system.config.prod.js already exists
[13:17:07] WARN src/public/index.html already exists
[13:17:07] WARN Please move or delete existing files to prevent overwiting. Use a diff tool to track project specific changes.
```

The update task copies new files, warns about overwriting existing files.

If you have changed boilerplate files, you will need to diff them against the new files.
Copy the files into a temporary directory and run the command again, then diff the existing files to check for project specific changes.

If you do not have changes to the boilerplate files, just remove the files and run the command again.


### lazy.config.json

A new file is required to configure both the production build script and the SystemJS polyfill at runtime.

```
{
    "bundles": {
        "shared/components/lazy/lazy.module.out-tsc.js": {
            "src": "./out-tsc/src/app/shared/components/lazy/lazy.module.out-tsc.js",
            "filename": "lazy.module.bundle.js",
            "className": "LazyModuleNgFactory",
            "path": "http://localhost:4200",
            "externs": []
        }
    }
}
```

^ All properties are required except `externs`

To bundle third party scripts, point to the minified version of the script in the externs Array.

```
"externs": [
                "node_modules/marked/marked.min.js"
           ]
```

If you use `--dynamicRoutes` during update you will be prompted to overwrite existing project. An additional `routes` property is now available in `lazy.config.json`. This flat Array will configure routes for any lazyloaded children of the root Component.


-------------------------------------------------------------------------------------------------------------

## 1.0.0-beta.9

- Fixed issue with update warning

-------------------------------------------------------------------------------------------------------------


## 1.0.0-beta.8

- Cleaned up terminal logs
- Added warning message for when locally installed cli is out of date
- Fixed missing .map file for Reflect.js in --jit mode

-------------------------------------------------------------------------------------------------------------

## 1.0.0-beta.7

- New wizard makes codegen simpler, trigger with `ngr generate wizard`
- Fixed usage of `g` as shorthand for `generate`

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

-------------------------------------------------------------------------------------------------------------

## 1.0.0-beta.6

- Use `ngr update --angularVersion` to update your package.json to a specific version of @angular
- New and improved Module generation. `--include` flag can be configured to auto import Component, Directive, Routes into the Module.

EXAMPLE:

```

ngr generate module --include component,route,spec,e2e --dir src/app/shared/components/my-module --name my-module

```

- Fixed issues at startup by pushing serve command to end of script during build
- Optimized default library files copied at start of build scripts
- Deprecated dependency on angular-srcs
- Bumped default version of scaffolded app to @angular 4.4.2
- Fixed issue with --serve flag when building for dev in --jit mode
- Updated README to latest

COMING SOON FOR 1.0.0-beta

- Reduced configuration of lazyload build
- Wizard for generating modules
- Better user feedback during Closure Compiler bundling


-------------------------------------------------------------------------------------------------------------

## 1.0.0-beta.4

- Hotfix TypeScript compilation onchange when using `ngr build dev --jit`

-------------------------------------------------------------------------------------------------------------

## 1.0.0-beta.3

- Hotfix for global css that would not compile correctly

-------------------------------------------------------------------------------------------------------------

## 1.0.0-beta.2

- Refactored SASS / PostCSS build steps, removed duplicate code
- Added config for the `libsass` compiler
- Added support for multiple global CSS files in the `src/style` directory to be deployed to `/build` or `/dist`
- Deprecated `config.globalCSSFilename` property


The build will default to the following configuration for SASS if you do not provide one:

```
{
    includePaths: ['src/style/'],
    outputStyle: 'expanded',
    sourceComments: false
}
```

Configure SASS in `build.config.js` for each build like in the following example. The configuration takes any options [node-sass](https://github.com/sass/node-sass) can be configured with, except `file` and `outFile` which is handled by the build scripts.

```
style: {
        sass: {
            dev: {
                includePaths: ['src/style/'],
                outputStyle: 'expanded',
                sourceComments: true
            },
            lib: {
                includePaths: ['src/style/'],
                outputStyle: 'expanded',
                sourceComments: false
            },
            prod: {
                includePaths: ['src/style/'],
                outputStyle: 'expanded',
                sourceComments: false
            }
        }
    }

```

-------------------------------------------------------------------------------------------------------------


## 1.0.0-beta.1

- Bypass Rollup and build for production with ClosureCompiler in ADVANCED_OPTIMIZATIONS mode
- EXPERIMENTAL Support for lazyloading routes with ClosureCompiler, requires additional high level API coming soon
- Bugfixes and improvements for existing builds

NOTE: While in BETA this package is EXPERIMENTAL

Closure builds are only available for < 5.0.0 at the moment.

To build for production with ClosureCompiler use the following flags:

`ngr build prod --closure`

To build for production with support for lazyloaded routes:

`ngr build prod --closure --lazy`

-------------------------------------------------------------------------------------------------------------

## 1.0.0-beta.0

- Updated npm package name to `angular-rollup`, `angular2-rollup` is deprecated
- Cross platform support including MacOS, Windows and Linux for the CLI
- Updated CLI to support `@angular` 5.0.0+
- `ngr build dev --watch` will trigger `ngc` in `--watch` mode
- `ngr build jit` triggers JIT build, use for `@angular` 4.0.0 development
- Backwards compatible to 4.0.0 with minor adjustments to config, 2.0.0 by downgrading `@angular` boilerplate

NOTE: While in BETA this package is EXPERIMENTAL

If you want to build an app with this project now it is recommended you use the `angular2-rollup` npm package instead.
Minimal changes will be required to upgrade to `angular-rollup`.

`npm install angular2-rollup@4.4.0-RC.0`

-------------------------------------------------------------------------------------------------------------
