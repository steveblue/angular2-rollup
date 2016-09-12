"use strict";
// server.js

const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const config = {
  dev: require('./conf/config.local.js'),
  prod: require('./conf/config.prod.js')
};

let env = process.env.NODE_ENV || 'dev';
let ssl = false;
var server;

process.argv.forEach(function(arg){

  if(arg === '--https') {
    ssl = true;
  }

});

const port = config[env].port || process.env.PORT;
const host = config[env].origin;

// Start Express

const app = express();

// Livereload Server Start

let live = function() {
   let livereload = require('livereload');
   let liveserver = livereload.createServer({
     port: 35729
   });
   liveserver.watch([__dirname + '/dist/assets',
                     __dirname + '/dist/src',
                     __dirname + '/dist/style',
                     __dirname + '/dist/*.html',
                     __dirname + '/dist/*.js']);
   console.log('Livereload available at '+host+':'+35729);
};

// Create Server

if ( env === 'prod' ) {

  if ( ssl === true ) {
    const options = {
                  key: fs.readFileSync('./conf/ssl/key.pem'),
                  cert: fs.readFileSync('./conf/ssl/cert.pem')
              };
    server = https.createServer(options, app);
  } else {
    server = http.createServer(app);
  }

}

if ( env === 'dev' ) {
   server = http.createServer(app);
   live();
}


// Express Middleware



// Load Modules

const routes = require('./router')(app);

// Server Start

server.listen(port);

console.log('Express available at '+host+':'+port);

module.exports = app;
