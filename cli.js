#!/usr/bin/env node

require('shelljs/global');
const semver      = require('semver');
const path        = require('path');
const fs          = require('fs');
const program     = require('commander');
const spawn       = require('child_process').spawn;
const package     = require(__dirname + '/package.json');
const prompt      = require('prompt');


let cliCommand = '';
let useVersion = '^5.0.0';

program
    .version(package.version)
    .usage('<keywords>')
    .option('build, --build, b [env]', 'Build the application by environment')
    .option('-w, --watch [bool]', 'Enable file watchers to detect changes and build')
    .option('--postcss [bool]', 'Enable postcss for build, default is true')
    .option('--jit [bool]', 'Run dev build in JIT mode, also use ngr build jit')
    .option('--closure [bool]', 'Bundle with ClosureCompiler in ADVANCED_OPTIMIZATIONS mode, this is the default')
    .option('--lazy [bool]', 'Bundle with ClosureCompiler with support for lazyloaded modules, generate a lazyloaded route, or scaffold an app with lazyloaded modules')
    .option('--remote [bool]', 'Bundle a lazyloaded route without a localized main bundle or sibling bundles, requires .MF copied into tmp directory in pre build step')
    .option('--rollup [bool]', 'Bundle with Rollup prior to optimizing with ClosureCompiler in SIMPLE_OPTIMIZATIONS mode')
    .option('--verbose [bool]', 'Log additional messages in build')
    .option('--deploy [bool]', 'Option to deploy build available in buildHooks.env.post arguments' )
    .option('--externs [bool]', 'Option to use or ignore closure.externs.js when counting vendor files during prod build, default is true')
    .option('-c, --config [string]', 'Path to configuration file for library build')
    .option('g, generate [type]', 'Generates new code from templates')
    .option('-n, --name [string]', 'The name of the new code to be generated (kebab-case)')
    .option('-f, --force [bool]', 'Force overwrite during code generate')
    .option('-d, --dir [path]', 'Path the code should be generated in (relative)')
    .option('--spec [bool, string]', 'Include spec files in code generation, when generating unit tests optionally specify "directive" for directive tests instead of the default component tests')
    .option('--e2e [bool]', 'Include e2e spec files in code generation')
    .option('--include [string]', 'When generating modules generate and import component, directive, and/or routes')
    .option('-r, --route [bool]', 'Include route files in code generation')
    .option('-t, --test [bool]', 'Run unit tests')
    .option('-l, --lint [bool]', 'Run Codelyzer on startup')
    .option('serve, --serve [bool]', 'Run Express Server')
    .option('scaffold, --scaffold [bool]', 'Scaffold a new project')
    .option('--lib [bool]', 'Scaffold a new project with support for library builds')
    .option('--rollup [bool]', 'Scaffold a new project with support for bundling with Rollup and Closure Compiler in SIMPLE_OPTIMIZATIONS mode')
    .option('--server [bool]', 'Scaffold a new project with an Express server')
    .option('--bare [bool]', 'Scaffold a new project with a simple Hello World, exclude the demo')
    .option('--dynamicRoutes [bool]', 'Scaffold a new project with support for routes configured by JSON prior to Bootstrap')
    .option('--electron [bool]', 'Scaffold a new project with additional files needed to support Electron, serve with Electron')
    .option('--angularVersion [string]', 'Scaffold a new project with a specific @angular version')
    .option('update, --update [bool]', 'Update a project')
    .option('--cliVersion [string]', 'Update an existing project with changes to config files provided by the cli')
    .parse(process.argv);

if (program.scaffold) {

    if (program.lib) {
        cliCommand = 'node ' + path.normalize(path.dirname(fs.realpathSync(__filename)) + '/build.scaffold.js') + ' --lib';
    } else {
        cliCommand = 'node ' + path.normalize(path.dirname(fs.realpathSync(__filename)) + '/build.scaffold.js');
    }

    if (program.angularVersion === undefined) {
        cliCommand += ' version=' + useVersion;
    } else {
        cliCommand += ' version=' + program.angularVersion;
    }

    if (program.dynamicRoutes) {
        cliCommand += ' dynamicRoutes=true';
    }

    if (program.electron) {
        cliCommand += ' electron=true';
    }

    if (program.lazy) {
        cliCommand += ' lazy=true';
    }

    if (program.rollup) {
        cliCommand += ' rollup=true';
    }

    if (program.server === false) {
        cliCommand += ' server=false';
    } else {
        cliCommand += ' server=true';
    }

    if (program.bare) {
        cliCommand += ' bare=true';
    }

    spawn(cliCommand, { shell: true, stdio: 'inherit' });

    return;

}

const utils = require(__dirname + '/build.utils.js');
const config = utils.config;

let cmpVersions = function(a, b) {
    var i, diff;
    var regExStrip0 = /(\.0+)+$/;
    var segmentsA = a.replace(regExStrip0, '').split('.');
    var segmentsB = b.replace(regExStrip0, '').split('.');
    var l = Math.min(segmentsA.length, segmentsB.length);

    for (i = 0; i < l; i++) {
        diff = parseInt(segmentsA[i], 10) - parseInt(segmentsB[i], 10);
        if (diff) {
            return diff;
        }
    }
    return segmentsA.length - segmentsB.length;
}

let updateMessage = function(result) {
    utils.warn('');
    utils.alert(utils.colors.red('Please update angular-rollup to the latest version ' + result.trim()));
    utils.alert(utils.colors.red('See what\'s changed https://github.com/steveblue/angular2-rollup/blob/master/CHANGELOG.md'));
    utils.alert(utils.colors.white('npm i -g angular-rollup@latest'));
    utils.warn('');
}

let devMessage = function(result) {
    utils.alert(utils.colors.grey('angular-rollup DEVELOPMENT '+result.trim()));
}

let versionMessage = function (result) {
    utils.alert(utils.colors.grey('angular-rollup ' + result.trim()));
}

let checkVersion = function(package, result, index) {
    if (package.version.split('.')[index] === result.split('.')[index] &&
        package.version.includes('beta') && result.includes('rc') ||
        package.version.includes('beta') && result.includes('rc') !== true && result.includes('beta') !== true ||
        package.version.includes('rc') && result.includes('rc') !== true) {
       return true;
    } else {
        return false;
    }
}

let isSameRelease = function(remote, package) {
    if (remote.includes('beta') && package.version.includes('beta')) {
        return true;
    }
    else if (remote.includes('rc') && package.version.includes('rc')) {
        return true;
    }
    else if (remote.includes('rc') == false && package.version.includes('rc') == false && remote.includes('beta') == false && package.version.includes('beta') == false) {
        return true;
    } else {
        return false;
    }
}

let init = function() {

    if (program.serve && program.build === undefined) {

        let serverCommand = 'npm run serve';

        if (program.watch === true) {
            serverCommand += ' watch=true';
        }
        else {
            serverCommand += ' watch=false';
        }

        spawn(serverCommand, { shell: true, stdio: 'inherit' });

    }

    if (program.build) {

        let projectPackage = JSON.parse(JSON.stringify(require(config.processRoot + '/package.json')));

        if (program.build === true) {
            utils.warn('Please use a proper argument for ngr build. i.e. prod, dev, jit');
            return;
        }

        if (program.build === 'dev' && program.jit === undefined && parseInt(projectPackage.dependencies['@angular/core'].split('.')[0]) < 5) {
            utils.warn('Project version is ' + projectPackage.dependencies['@angular/core'] + '. Use ngr build dev --jit or ngr build jit < 5.0.0');
            return;
        }

        if (program.build === 'dev' && program.jit === true) { // override dev build with --jit argument
            program.build = 'jit';
        }

        let buildRoot = fs.existsSync(path.join(config.processRoot, 'build.' + program.build + '.js')) ? config.processRoot : config.cliRoot;

        cliCommand = 'rimraf build && node ' + path.join(buildRoot, 'build.' + program.build + '.js');

        if (program.watch === true) {
            cliCommand += ' watch=true';
        }
        else {
            cliCommand += ' watch=false';
        }

        if (program.postcss === 'false') {
            cliCommand += ' postcss=false';
        }
        else if (program.build === 'dev' && program.postcss === undefined) {
            cliCommand += ' postcss=false';
        }
        else {
            cliCommand += ' postcss=true';
        }

        if (program.rollup === true || program.build === 'lib') {
            cliCommand += ' rollup=true';
            cliCommand += ' closure=false';
        }
        else {
            cliCommand += ' rollup=false';
            cliCommand += ' closure=true';
        }

        if (program.lazy === true) {
            cliCommand += ' lazy=true';
        }
        else {
            cliCommand += ' lazy=false';
        }

        if (program.verbose === true) {
            cliCommand += ' verbose=true';
        }
        else {
            cliCommand += ' verbose=false';
        }

        if (program.serve === true) {
            cliCommand += ' serve=true';
        }
        else {
            cliCommand += ' serve=false';
        }

        if (program.electron === true) {
            cliCommand += ' electron=true';
        }
        else {
            cliCommand += ' electron=false';
        }

        if (program.deploy === true) {
            cliCommand += ' deploy=true';
        }
        else {
            cliCommand += ' deploy=false';
        }

        if (program.remote === true) {
            cliCommand += ' remote=true';
        }
        else {
            cliCommand += ' remote=false';
        }

        if (program.externs === false) {
            cliCommand += ' externs=false';
        }
        else {
            cliCommand += ' externs=true';
        }

        if (program.config && program.config.length > 0) {
            cliCommand += ' config=' + program.config;
        }

        spawn(cliCommand, { shell: true, stdio: 'inherit' });

    }

    if (program.unit) {

        spawn(`npm run test`, { shell: true, stdio: 'inherit' });

    }

    if (program.lint) {

        spawn(`npm run lint`, { shell: true, stdio: 'inherit' });

    }


    if (program.generate) {

        if (program.generate === 'wizard') {

            let validateEntry = function (value) {
                if (value === 'true' ||
                    value === true ||
                    value === 'lazy' ||
                    value === 'Y' ||
                    value === 'y' ||
                    value === 'YES' ||
                    value === 'yes') {
                    return true;
                } else {
                    return false;
                }
            };

            utils.console.log(utils.colors.green('ngr codegen wizard'));
            utils.console.log('filename: ' + utils.colors.gray('kabab-case filename i.e. global-header'));
            utils.console.log('directory: ' + utils.colors.gray('path/to/folder i.e. src/app/shared/components/global-header'));
            utils.console.log('type: ' + utils.colors.gray('module, component, directive, enum, e2e, guard, interface, pipe, service, lib'));
            utils.console.log(utils.colors.bold('Follow the prompts after selecting a type'));

            prompt.message = '';
            prompt.start();
            prompt.get(['filename', 'directory', 'type'], function (err, result) {

                if (result.type === 'module') {
                    prompt.addProperties({ filename: result.filename, directory: result.directory, type: result.type },
                        ['component', 'directive', 'routes', 'unit', 'e2e'],
                        function (err, result) {

                            let includes = '';

                            for (let prop in result) {
                                if (prop !== 'directory' && prop !== 'filename' && prop !== 'type') {

                                    if (validateEntry(result[prop])) {
                                        if (prop === 'e2e') {
                                            includes += prop + ',';
                                        } else {
                                            includes += prop;
                                        }
                                    }

                                }
                            }


                            let options = {
                                path: result.directory,
                                name: result.filename,
                                type: result.type,
                                force: false,
                                spec: false,
                                e2e: false,
                                route: false,
                                include: includes,
                                lazy: (result['routes'] && result['routes'] === 'lazy') ? true : false
                            };

                            utils.generate.copy(options);
                        });
                }

                else if (result.type === 'unit') {

                    prompt.addProperties({ filename: result.filename, directory: result.directory, type: result.type },
                        ['component'],
                        function (err, result) {

                            if (validateEntry(result['component'])) {

                                let options = {
                                    path: result.directory,
                                    name: result.filename,
                                    type: result.type,
                                    force: false,
                                    spec: false,
                                    e2e: false,
                                    route: false,
                                    include: false,
                                    lazy: false
                                };

                                utils.generate.copy(options);

                            } else {

                                prompt.addProperties({ filename: result.filename, directory: result.directory, type: result.type },
                                    ['directive'],
                                    function (err, result) {

                                        let options = {
                                            path: result.directory,
                                            name: result.filename,
                                            type: result.type,
                                            force: false,
                                            spec: 'directive',
                                            e2e: false,
                                            route: false,
                                            include: false,
                                            lazy: false
                                        };

                                        utils.generate.copy(options);

                                    });
                            }

                        });
                }

                else if (result.type === 'component' || result.type === 'directive') {

                    prompt.addProperties({ filename: result.filename, directory: result.directory, type: result.type },
                        ['unit', 'e2e'],
                        function (err, result) {

                            let options = {
                                path: result.directory,
                                name: result.filename,
                                type: result.type,
                                force: false,
                                spec: validateEntry(result['unit']),
                                e2e: validateEntry(result['e2e']),
                                route: false,
                                include: false,
                                lazy: false
                            };

                            utils.generate.copy(options);

                        });
                } else {

                    if (result.type === 'library') {
                        result.type = 'lib';
                    }

                    let options = {
                        path: result.directory,
                        name: result.filename,
                        type: result.type,
                        force: false,
                        spec: false,
                        e2e: false,
                        route: false,
                        include: false,
                        lazy: false
                    };

                    utils.generate.copy(options);
                }

            });
            return;

        } else {

            if (typeof (program.name) === 'function') {
                utils.warn('generate requires a name in kebab-case. Please use --name argument to specify a name.');
                return;
            }

            let spec = false;

            if (program.generate === 'unit' && program.spec === 'directive') {
                spec = 'directive';
            } else if (program.spec) {
                spec = true;
            }

            let options = {
                path: program.dir ? process.cwd() + '/' + program.dir : process.cwd(),
                name: program.name || 'test',
                type: program.generate,
                force: program.force ? true : false,
                spec: spec,
                e2e: program.e2e ? true : false,
                route: program.route ? true : false,
                include: program.include,
                lazy: program.lazy ? true : false
            };

            utils.generate.copy(options);
        }

    }


    if (program.update) {

        cliCommand = 'node ' + path.normalize(path.dirname(fs.realpathSync(__filename)) + '/build.update.js');

        if (program.angularVersion) {
            cliCommand += ' version=' + program.angularVersion;
        }

        if (program.cliVersion) {
            cliCommand += ' cliVersion=' + program.cliVersion;
        }

        if (program.lib) {
            cliCommand += ' lib=' + program.lib;
        }

        if (program.dynamicRoutes) {
            cliCommand += ' dynamicRoutes=true';
        }

        spawn(cliCommand, { shell: true, stdio: 'inherit' });

    }

    if (program.test) {

        if (program.watch === true) {
            spawn('npm run test:watch', { shell: true, stdio: 'inherit' });
        }
        else {
            spawn('npm run test', { shell: true, stdio: 'inherit' });
        }

    }
}

if (!program.generate) {

    exec('npm view angular-rollup version', { silent: true }, function (err, result, c) {

        let sanitizedResult = result.replace('-beta', '').replace('-rc', '').trim();
        let sanitizedPackageVersion = package.version.replace('-beta', '').replace('-rc', '').replace(',', '');
        let sortedList = [sanitizedResult, sanitizedPackageVersion].sort(cmpVersions);

        if (result.split('.')[0] === package.version.split('.')[0] &&
            result.includes('beta') && package.version.includes('rc')) {
            devMessage(package.version);
        }
        else if (isSameRelease(result, package) &&
            parseInt(package.version.split('.')[0]) > parseInt(result.split('.')[0]) ||
            parseInt(package.version.split('.')[1]) > parseInt(result.split('.')[1]) ||
            parseInt(package.version.split('.')[2]) > parseInt(result.split('.')[2]) ||
            parseInt(package.version.split('.')[3]) > parseInt(result.split('.')[3])) {
            devMessage(package.version);
        }
        else if (checkVersion(package, result, 0) || checkVersion(package, result, 1) || checkVersion(package, result, 2)) {
            updateMessage(result);
        }
        else if (sanitizedResult !== sanitizedPackageVersion) {
            if (sortedList[1] === sanitizedResult) {
                updateMessage(result);
            }
        } else {
            versionMessage(package.version);
        }
    });

}

init();



