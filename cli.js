#!/usr/bin/env node

require('shelljs/global');

const path        = require('path');
const fs          = require('fs');
const program     = require('commander');
const spawn       = require('child_process').spawn;
const utils       = require('./build.utils.js');
const package     = require('./package.json');
const paths        = utils.paths;

fs.writeFile(paths.projectRoot + '/cli.config.js', 'module.exports = { cliRoot: "' + paths.cliRoot + '"}', function (err) {
    if (err) {
        return console.log(err);
    }
});

let cliCommand = '';

program
    .version(package.version)
    .usage('<keywords>')
    .option('-b, --build [env]', 'Build the application by environment')
    .option('-w, --watch [bool]', 'Enable file watchers to detect changes and build')
    .option('-g, --generate [type]', 'Generates new code from templates')
    .option('-n, --name [string]', 'The name of the new code to be generated (kebab-case)')
    .option('-f, --force [bool]', 'Force overwrite during code generate')
    .option('-d, --dir [path]', 'Path the code should be generated in (relative)')
    .option('-s, --spec [bool]', 'Include spec files in code generation')
    .option('-r, --route [bool]', 'Include route files in code generation')
    .option('-t, --test [bool]', 'Run unit tests')
    .option('-l, --lint [bool]', 'Run Codelyzer on startup')
    .option('--serve [bool]', 'Run Express Server')
    .option('--scaffold [bool]', 'Scaffold a new project')
    .option('--noLib [bool]', 'Scaffold a new project without support for library builds')
    .parse(process.argv);


if (program.serve) {

    let serverCommand = 'npm run dev:server';

    if (program.watch === true) {
        serverCommand += ' watch=true';
    }
    else {
        serverCommand += ' watch=false';
    }

    spawn(serverCommand, { shell: true, stdio: 'inherit' });

}

if (program.build) {

    let buildRoot = fs.existsSync(paths.projectRoot + '/build.' + program.build + '.js') ? paths.projectRoot : paths.cliRoot;

    cliCommand = 'rimraf build && node ' + buildRoot + '/build.'+program.build+'.js';

    if (program.watch === true) {
        cliCommand += ' watch=true';
    }
    else {
        cliCommand += ' watch=false';
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
        route: program.route ? true : false
    };

    utils.generate.copy(options);

}


if (program.scaffold) {

    if (program.noLib) {
        cliCommand = 'node '+path.dirname(fs.realpathSync(__filename))+'/build.scaffold.js --noLib';
    } else {
        cliCommand = 'node '+path.dirname(fs.realpathSync(__filename))+'/build.scaffold.js';
    }

    cp(path.dirname(fs.realpathSync(__filename))+'/build.config.js', path.dirname(process.cwd()) + '/' + path.basename(process.cwd()));
    spawn(cliCommand, { shell: true, stdio: 'inherit' });

}



