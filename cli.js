#!/usr/bin/env node

require('shelljs/global');

const path        = require('path');
const fs          = require('fs');
const program     = require('commander');
const spawn       = require('child_process').spawn;
const utils       = require(__dirname + '/build.utils.js');
const package     = require(__dirname + '/package.json');
const config      = utils.config;

let cliCommand = '';
let useVersion = '5.0.0-beta.6';

program
    .version(package.version)
    .usage('<keywords>')
    .option('build, --build, b [env]', 'Build the application by environment')
    .option('-w, --watch [bool]', 'Enable file watchers to detect changes and build')
    .option('--postcss [bool]', 'Enable postcss for dev build, default is false')
    .option('--jit [bool]', 'Run dev build in JIT mode, also use ngr build jit')
    .option('--closure [bool]', 'Bypass Rollup and bundle with ClosureCompiler')
    .option('--lazy [bool]', 'Bypass Rollup and bundle with ClosureCompiler with support for lazyloaded modules')
    .option('--verbose [bool]', 'Log additional messages in build')
    .option('generate, --generate, g [type]', 'Generates new code from templates')
    .option('-n, --name [string]', 'The name of the new code to be generated (kebab-case)')
    .option('-f, --force [bool]', 'Force overwrite during code generate')
    .option('-d, --dir [path]', 'Path the code should be generated in (relative)')
    .option('--spec [bool]', 'Include spec files in code generation')
    .option('e2e [bool]', 'Include e2e spec files in code generation')
    .option('-r, --route [bool]', 'Include route files in code generation')
    .option('-t, --test [bool]', 'Run unit tests')
    .option('-l, --lint [bool]', 'Run Codelyzer on startup')
    .option('serve, --serve [bool]', 'Run Express Server')
    .option('scaffold, --scaffold [bool]', 'Scaffold a new project')
    .option('--lib [bool]', 'Scaffold a new project with support for library builds')
    .option('--angularVersion [string]', 'Scaffold a new project with a specific @angular version')
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

    if (program.closure === true) {
        cliCommand += ' closure=true';
    }
    else {
        cliCommand += ' closure=false';
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

    let options = {
        path: program.dir ? process.cwd() + '/' + program.dir : process.cwd(),
        name: program.name || 'test',
        type: program.generate,
        force: program.force ? true : false,
        spec: program.spec ? true : false,
        e2e: program.e2e ? true : false,
        route: program.route ? true : false
    };

    utils.generate.copy(options);

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


if (program.test) {

    if (program.watch === true) {
        spawn('npm run test:watch', { shell: true, stdio: 'inherit' });
    }
    else {
        spawn('npm run test', { shell: true, stdio: 'inherit' });
    }

}


