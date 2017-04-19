#!/usr/bin/env node

require('shelljs/global');

const program     = require('commander');
const spawn       = require('child_process').spawn;

let cliCommand = '';

program
    .version('4.0.2')
    .usage('<keywords>')
    .option('-b, --build [env]', 'Build the application by environment')
    .option('-w, --watch [bool]', 'Enable file watchers to detect changes and build')
    .option('-g, --generate [type]', 'Generates new code from templates')
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

    if (program.generate === 'class') {

    }
    if (program.generate === 'component') {

    }
    if (program.generate === 'directive') {

    }
    if (program.generate === 'enum') {

    }
    if (program.generate === 'guard') {

    }
    if (program.generate === 'interface') {

    }
    if (program.generate === 'module') {

    }
    if (program.generate === 'pipe') {

    }
    if (program.generate === 'service') {

    }

    spawn(cliCommand, { shell: true, stdio: 'inherit' });

    return;

}



