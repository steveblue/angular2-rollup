#!/usr/bin/env node
const fs       = require('fs');
const program = require('commander');
const package = require(__dirname + '/package.json');

program
    .version(package.version)
    .usage('<keywords>')
    .option('build [env]', 'build the application')
    .option('--watch [bool]', 'listen for changes in filesystem and rebuild')
    .option('--clean [bool]', 'destroy the build folder prior to compilation, automatic for prod')
    .parse(process.argv);

fs.writeFileSync(__dirname + '/cli.config.json', JSON.stringify({
    env: program.build,
    program: program
}, null, 4), 'utf-8');

if (program.build) {

    const BuildScript = require('./src/build/'+program.build+'.js');
    let build = new BuildScript().init();

}
