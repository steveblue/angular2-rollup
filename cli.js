#!/usr/bin/env node

require('shelljs/global');

const path        = require('path');
const fs          = require('fs');
const program     = require('commander');
const spawn       = require('child_process').spawn;
const utils       = require(__dirname + '/build.utils.js');
const package     = require(__dirname + '/package.json');
const paths        = utils.paths;

let cliCommand = '';

program
    .version(package.version)
    .usage('<keywords>')
    .option('build, --build, b [env]', 'Build the application by environment')
    .option('-w, --watch [bool]', 'Enable file watchers to detect changes and build')
    .option('--postcss [bool]', 'Enable postcss for dev build, default is false')
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


if (program.serve) {

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


    let buildRoot = fs.existsSync(path.join(paths.projectRoot , 'build.' + program.build + '.js')) ? paths.projectRoot : paths.cliRoot;

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

    spawn(cliCommand, { shell: true, stdio: 'inherit' });

    if (program.build === 'dev' && program.watch === true) {
        let tsc = spawn(path.normalize(paths.projectRoot + '/node_modules/.bin/ngc') +' -p tsconfig.dev.json --watch', { shell: true, stdio: 'inherit' });
    }

    if (program.build === 'dev' && program.watch === undefined) {
        let tsc = spawn(path.normalize(paths.projectRoot + '/node_modules/.bin/ngc') +' -p tsconfig.dev.json', { shell: true, stdio: 'inherit' });
    }

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

    if (program.angularVersion !== undefined) {
        cliCommand += ' version=' + program.angularVersion
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


