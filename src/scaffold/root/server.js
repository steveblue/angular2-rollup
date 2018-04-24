"use strict";
// server.js

const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const app = express();
const config = require('./ngr.config.js');
const serverConfig = {
  dev: require('./config/server.config.dev.js'),
  prod: require('./config/server.config.prod.js')
};


let env = process.env.NODE_ENV || 'dev';
const port = serverConfig[env].port || process.env.PORT;
const host = serverConfig[env].origin;
let canWatch = false;
let server;

process.argv.forEach(function(arg){

  if (arg.includes('watch')) {
    canWatch = arg.split('=')[1].trim() === 'true' ? true : false;
  }

});


// Livereload Server Start

let live = function() {
   let livereload = require('livereload');
   let liveserver = livereload.createServer({
     port: 35729
   });
   liveserver.watch([__dirname + '/'+config.build+'/assets',
                     __dirname + '/'+config.build+'/src',
                     __dirname + '/'+config.build+'/style',
                     __dirname + '/'+config.build+'/*.html',
                     __dirname + '/'+config.build+'/*.js',
                     __dirname + '/'+config.build+'/*.css']);
   console.log('Livereload available at '+host+':'+35729);
};

// Create Server

server = http.createServer(app);

if (canWatch === true) {

  live();

}


// Express Middleware



// Load Modules

const routes = require('./router')(app);

// Server Start

server.listen(port);

console.log('Express available at '+host+':'+port);


module.exports = app;
