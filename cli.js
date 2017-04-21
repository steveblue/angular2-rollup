#!/usr/bin/env node

require('shelljs/global');


const fs          = require('fs');
const program     = require('commander');
const spawn       = require('child_process').spawn;
const utils       = require('./build.utils.js');
const package     = require('./package.json');


let cliCommand = '';

program
    .version(package.version)
    .usage('<keywords>')
    .option('-b, --build [env]', 'Build the application by environment')
    .option('-w, --watch [bool]', 'Enable file watchers to detect changes and build')
    .option('-g, --generate [type]', 'Generates new code from templates')
    .option('-f, --force [bool]', 'Force overwrite during code generate')
    .option('-s, --spec [bool]', 'Include spec files in code generation')
    .option('-r, --route [bool]', 'Include route files in code generation')
    .parse(process.argv);


if (program.build) {

    cliCommand += 'npm run build:'+program.build;

    if (program.watch === true) {
        cliCommand += ' watch=true';
    }
    else {
        cliCommand += ' watch=false';
    }

    spawn(cliCommand, { shell: true, stdio: 'inherit' });

    return;

}

if (program.generate) {

    // TODO: Make Boilerplate Templates and cp them here

    let options = {
        path: process.cwd(),
        name: 'Hello',
        type: program.generate,
        force: program.force ? true : false,
        spec: program.spec ? true : false,
        route: program.route ? true : false
    };

    utils.generate.copy(options);

    //spawn(cliCommand, { shell: true, stdio: 'inherit' });

    return;

}



