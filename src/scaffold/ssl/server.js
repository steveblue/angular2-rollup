'use strict';
// server.js

const express = require('express');
const https = require('https');
const path = require('path');
const fs = require('fs');
const app = express();
const config = require(process.cwd() + '/angular.json');
const serverConfig = {
  dev: require(process.cwd() + '/config/server.config.dev.js'),
  prod: require(process.cwd() + '/config/server.config.prod.js')
};
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'cert.pem')),
  requestCert: false,
  rejectUnauthorized: false
};

let projectRoot = config.projects[config.defaultProject].architect.build.options.outputPath;
let env = process.env.NODE_ENV || 'dev';
const port = serverConfig[env].port || process.env.PORT;
const host = serverConfig[env].origin;
let canWatch = false;
let server;

process.argv.forEach(function(arg) {
  if (arg.includes('watch')) {
    canWatch = arg.split('=')[1].trim() === 'true' ? true : false;
  }
});

// Create Server

server = https.createServer(sslOptions, app);

// Livereload Server Start

let live = function() {
  let livereload = require('livereload');
  let liveserver = livereload.createServer({
    port: 35729,
    https: {
      key: fs.readFileSync(path.join(__dirname, 'key.pem')),
      cert: fs.readFileSync(path.join(__dirname, 'cert.pem'))
    }
  });
  liveserver.watch([
    process.cwd() + '/' + projectRoot + '/assets',
    process.cwd() + '/' + projectRoot + '/src',
    process.cwd() + '/' + projectRoot + '/style',
    process.cwd() + '/' + projectRoot + '/*.html',
    process.cwd() + '/' + projectRoot + '/*.js',
    process.cwd() + '/' + projectRoot + '/*.css'
  ]);
  console.log('Livereload available at ' + host + ':' + 35729);
};

if (canWatch === true) {
  live();
}

// Express Middleware

// Load Modules

const routes = require('./router')(app);

// Server Start

server.listen(port, () => {
  console.log('SSL connection available at ' + host + ':' + port);
});

module.exports = app;
