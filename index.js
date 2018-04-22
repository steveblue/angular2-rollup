#!/usr/bin/env node

require('shelljs/global');
const findup = require('findup');
const fs = require('fs');
const path = require('path');
const colors = require('colors');
const program = require('commander');
const cliRoot = findup.sync(__dirname, 'package.json');
const package = require(__dirname + '/package.json');

if (process.argv.indexOf('scaffold') > -1) {
    cp(path.join(cliRoot, 'src', 'scaffold', 'root', 'ngr.config.js'),
       path.join(path.dirname(process.cwd()), path.basename(process.cwd())));
    process.argv.push('--verbose');
}

program
    .version(package.version)
    .usage('<keywords>')
    .option('scaffold [bool]', 'scaffold new application in current directory')
    .option('--src [string]', 'specify a path to the src folder')
    .option('--noinstall [bool]', 'prevents install during scaffold')
    .option('--yarn [bool]', 'use yarn instead of npm to install')
    .option('build [env]', 'build the application')
    .option('--clean [bool]', 'destroy the build folder prior to compilation, automatic for prod')
    .option('--watch [bool]', 'listen for changes in filesystem and rebuild')
    .option('--config [string]', 'path to configuration file for library build')
    .option('--deploy [bool]', 'call deploy buildHook')
    .option('--verbose [bool]', 'log all messages in list format')
    .option('--rollup [bool]', 'use rollup to bundle instead of closure compiler')
    .option('serve, --serve [bool]', 'spawn the local express server')
    .parse(process.argv);

let cli = () => {

    const util = require('./src/util');
    const config = require('./src/config');
    const log = require('./src/log');
    const Scaffold = require('./src/scaffold/index');

    if (program.build) {

        if (!fs.existsSync(path.normalize(config.cliRoot + '/src/build/' + program.build + '.js'))) {
            util.error(program.build + ' build does not exist.');
        }
        else {
            log.break();
            const BuildScript = require('./src/build/' + program.build + '.js');
            let build = new BuildScript().init();
        }
    }

    if (program.scaffold) {
        let scaffold = new Scaffold();
        scaffold.basic();
    }

    if (program.serve && !program.build) {
        util.serve();
    }

}

fs.writeFile(__dirname + '/cli.config.json', JSON.stringify({
    env: program.build,
    program: program
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
