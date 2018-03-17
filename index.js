#!/usr/bin/env node
const fs      = require('fs');
const program = require('commander');
const package = require(__dirname + '/package.json');

program
    .version(package.version)
    .usage('<keywords>')
    .option('build [env]', 'build the application')
    .option('--clean [bool]', 'destroy the build folder prior to compilation, automatic for prod')
    .option('--watch [bool]', 'listen for changes in filesystem and rebuild')
    .option('--config [string]', 'path to configuration file for library build')
    .option('--deploy [bool]', 'pass argument to post buildHook for deployment')
    .parse(process.argv);

fs.writeFileSync(__dirname + '/cli.config.json', JSON.stringify({
    env: program.build,
    program: program
}, null, 4), 'utf-8');

if (program.build) {

    const BuildScript = require('./src/build/'+program.build+'.js');
    let build = new BuildScript().init();

}
