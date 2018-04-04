#!/usr/bin/env node
const fs      = require('fs');
const path    = require('path');
const program = require('commander');
const package = require(__dirname + '/package.json');
const util    = require ('./src/util');
const config  = require('./src/config');
const log     = require('./src/log');
const Scaffold = require('./src/scaffold/index');

program
    .version(package.version)
    .usage('<keywords>')
    .option('scaffold [bool]', 'scaffold new application in current directory')
    .option('build [env]', 'build the application')
    .option('--clean [bool]', 'destroy the build folder prior to compilation, automatic for prod')
    .option('--watch [bool]', 'listen for changes in filesystem and rebuild')
    .option('--config [string]', 'path to configuration file for library build')
    .option('--deploy [bool]', 'call deploy buildHook')
    .option('--verbose [bool]', 'log all messages in list format')
    .option('--rollup [bool]', 'use rollup to bundle instead of closure compiler')
    .option('serve, --serve [bool]', 'spawn the local express server')
    .parse(process.argv);

if (program.scaffold) {
    let scaffold = new Scaffold();
    scaffold.basic();
}

if (program.build) {
    if (!fs.existsSync(path.normalize(config.cliRoot + '/src/build/' + program.build + '.js'))) {
        util.error(program.build + ' build does not exist.');
    }
}



fs.writeFile(__dirname + '/cli.config.json', JSON.stringify({
    env: program.build,
    program: program
}, null, 4), 'utf-8', () => {
    if (program.build) {
        log.break();
        const BuildScript = require('./src/build/'+program.build+'.js');
        let build = new BuildScript().init();
    }
});


let exitHandler = (options, err) => {
    //util.cleanOnExit();
    // if (err) util.error(err);
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