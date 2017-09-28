#!/usr/bin/env node

require('shelljs/global');
const semver      = require('semver');
const path        = require('path');
const fs          = require('fs');
const program     = require('commander');
const spawn       = require('child_process').spawn;
const utils       = require(__dirname + '/build.utils.js');
const package     = require(__dirname + '/package.json');
const prompt      = require('prompt');
const config      = utils.config;

let cliCommand = '';
let useVersion = '4.4.2';

function cmpVersions(a, b) {
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


exec('npm view angular-rollup version', { silent: true }, function(err, result, c) {

    let sanitizedResult = result.replace('-beta', '').trim();
    let sanitizedPackageVersion = package.version.replace('-beta', '').replace(',', '');
    let sortedList = [sanitizedResult, sanitizedPackageVersion].sort(cmpVersions);
    if (sanitizedResult !== sanitizedPackageVersion) {

        if (sortedList[1] === sanitizedResult) {
            utils.warn('');
            utils.warn('');
            utils.alert(utils.colors.red('Please update angular-rollup to the latest version ' + result.trim() ));
            utils.alert(utils.colors.red('See what\'s changed https://github.com/steveblue/angular2-rollup/blob/master/CHANGELOG.md'));
            utils.alert(utils.colors.white('npm i -g angular-rollup@latest'));
            utils.warn('');
            utils.warn('');
        }

    }

});

program
    .version(package.version)
    .usage('<keywords>')
    .option('build, --build, b [env]', 'Build the application by environment')
    .option('-w, --watch [bool]', 'Enable file watchers to detect changes and build')
    .option('--postcss [bool]', 'Enable postcss for dev build, default is false')
    .option('--jit [bool]', 'Run dev build in JIT mode, also use ngr build jit')
    .option('--closure [bool]', 'Bundle with ClosureCompiler in ADVANCED_OPTIMIZATIONS mode, this is the default')
    .option('--lazy [bool]', 'Bundle with ClosureCompiler with support for lazyloaded modules, generate a lazyloaded route')
    .option('--rollup [bool]', 'Bundle with Rollup prior to optimizing with ClosureCompiler in SIMPLE_OPTIMIZATIONS mode')
    .option('--verbose [bool]', 'Log additional messages in build')
    .option('g, generate [type]', 'Generates new code from templates')
    .option('-n, --name [string]', 'The name of the new code to be generated (kebab-case)')
    .option('-f, --force [bool]', 'Force overwrite during code generate')
    .option('-d, --dir [path]', 'Path the code should be generated in (relative)')
    .option('--spec [bool]', 'Include spec files in code generation')
    .option('--e2e [bool]', 'Include e2e spec files in code generation')
    .option('--include [string]', 'When generating modules generate and import component, directive, and/or routes')
    .option('-r, --route [bool]', 'Include route files in code generation')
    .option('-t, --test [bool]', 'Run unit tests')
    .option('-l, --lint [bool]', 'Run Codelyzer on startup')
    .option('serve, --serve [bool]', 'Run Express Server')
    .option('scaffold, --scaffold [bool]', 'Scaffold a new project')
    .option('--lib [bool]', 'Scaffold a new project with support for library builds')
    .option('--angularVersion [string]', 'Scaffold a new project with a specific @angular version')
    .option('update, --update [bool]', 'Update a project')
    .parse(process.argv);


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

    let projectPackage = JSON.parse(JSON.stringify(require(config.projectRoot + '/package.json')));

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

    let buildRoot = fs.existsSync(path.join(config.projectRoot , 'build.' + program.build + '.js')) ? config.projectRoot : config.cliRoot;

    cliCommand = 'rimraf build && node ' + path.join(buildRoot , 'build.'+program.build+'.js');

    if (program.watch === true) {
        cliCommand += ' watch=true';
    }
    else {
        cliCommand += ' watch=false';
    }

    if (program.postcss === true) {
        cliCommand += ' postcss=true';
    }
    else {
        cliCommand += ' postcss=false';
    }

    if (program.rollup === true) {
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

    spawn(cliCommand, { shell: true, stdio: 'inherit' });

}

if (program.unit) {

    spawn(`npm run test`, { shell: true, stdio: 'inherit' });

}

if (program.lint) {

    spawn(`npm run lint`, { shell: true, stdio: 'inherit' });

}


if (program.generate) {

    if(program.generate === 'wizard') {


        let validateEntry = function(value) {
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

        utils.console.log(utils.colors.red('ngr codegen wizard'));
        utils.console.log('filename: ' + utils.colors.gray('kabab-case filename i.e. global-header'));
        utils.console.log('directory: ' + utils.colors.gray('path/to/folder i.e. src/app/shared/components/global-header'));
        utils.console.log('type: ' + utils.colors.gray('module, component, directive, enum, e2e, guard, interface, pipe, service'));
        utils.console.log(utils.colors.bold('Follow the prompts after selecting a type'));

        prompt.message = '';
        prompt.start();
        prompt.get(['filename', 'directory', 'type'], function (err, result) {

            if (result.type === 'module') {
                prompt.addProperties({filename: result.filename, directory: result.directory, type: result.type},
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

        let options = {
            path: program.dir ? process.cwd() + '/' + program.dir : process.cwd(),
            name: program.name || 'test',
            type: program.generate,
            force: program.force ? true : false,
            spec: program.spec ? true : false,
            e2e: program.e2e ? true : false,
            route: program.route ? true : false,
            include: program.include,
            lazy: program.lazy ? true : false
        };

        utils.generate.copy(options);
    }

}


if (program.scaffold) {


    if (program.lib) {
        cliCommand = 'node '+path.normalize(path.dirname(fs.realpathSync(__filename))+'/build.scaffold.js')+' --lib';
    } else {
        cliCommand = 'node '+path.normalize(path.dirname(fs.realpathSync(__filename))+'/build.scaffold.js');
    }

    if (program.angularVersion === undefined) {
        cliCommand += ' version=' + useVersion;
    } else {
        cliCommand += ' version=' + program.angularVersion;
    }

    cp(path.join(path.dirname(fs.realpathSync(__filename)), 'build.config.js'), path.join(path.dirname(process.cwd()) , path.basename(process.cwd())));
    spawn(cliCommand, { shell: true, stdio: 'inherit' });

}

if (program.update) {

    cliCommand = 'node ' + path.normalize(path.dirname(fs.realpathSync(__filename)) + '/build.update.js');

    if (program.angularVersion === undefined) {
        cliCommand += ' version=' + useVersion;
    } else {
        cliCommand += ' version=' + program.angularVersion;
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


