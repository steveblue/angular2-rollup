#!/usr/bin/env node

require('shelljs/global');
const findup = require('findup');
const fs = require('fs');
const path = require('path');
const spawn = require('child_process').spawn;
const colors = require('colors');
const program = require('commander');
const cliRoot = findup.sync(__dirname, 'package.json');
const processRoot = path.join(path.dirname(process.cwd()), path.basename(process.cwd()));
const package = require(__dirname + '/package.json');

if (process.argv.indexOf('scaffold') > -1) {
    process.argv.push('--verbose');
}

program
    .version(package.version)
    .usage('<keywords>')
    .option('new [string]', 'scaffold new development environment in directory by name, i.e. ngr new my-app')
    .option('--src [string]', 'specify a path to the src folder')
    .option('--skip-install [bool]', 'prevents install during scaffold')
    .option('--yarn [bool]', 'use yarn instead of npm to install')
    .option('build [env]', 'build the application')
    .option('--clean [bool]', 'destroy the build folder prior to compilation, default for prod')
    .option('--watch [bool]', 'listen for changes in filesystem and rebuild')
    .option('--config [string]', 'path to configuration file for library build')
    .option('--deploy [bool]', 'call deploy buildHook')
    .option('--verbose [bool]', 'log all messages in list format')
    .option('--closure [bool]', 'bundle and optimize with closure compiler (default)')
    .option('--rollup [bool]', 'bundle with rollup and optimize with closure compiler')
    .option('--webpack [bool]', 'use @angular/cli to build')
    .option('serve, --serve [bool]', 'spawn the local express server')
    .parse(process.argv);

let cli = () => {
    let config = require('./src/config');
    let util = require('./src/util');
    let log = require('./src/log');
    let Scaffold = require('./src/scaffold/index');

    if (program.build) {
        log.destroy();

        const BuildScript = require('./src/build/' + program.build + '.js');
        let build = new BuildScript().init();
    }

    if (program.new) {
        log.destroy();
        let scaffold = new Scaffold(program.new, path.join(processRoot, program.new));
        scaffold.basic();
    }

    if (program.serve && !program.build) {
        log.destroy();
        util.serve();
    }

}
if (process.argv.indexOf('new') > -1) {
    if (fs.existsSync(path.join(processRoot, program.new))) {
        console.log(colors.red(program.new + ' already exists'));
        process.exit();
    }
    if (!fs.existsSync(path.join(processRoot, program.new))) mkdir(path.join(processRoot, program.new));
    cp(path.join(cliRoot, 'src', 'scaffold', 'root', 'ngr.config.js'), path.join(processRoot, program.new));
}
fs.writeFile(__dirname + '/cli.config.json', JSON.stringify({
    env: program.build,
    program: program,
    projectRoot: program.new ? path.join(processRoot, program.new) : processRoot
}, null, 4), 'utf-8', cli);


let exitHandler = (options, err) => {
    //util.cleanOnExit();
    if (err) console.log(colors.red('NGR ERROR', err));
    if (options.exit) process.exit();
}

// do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

// catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
