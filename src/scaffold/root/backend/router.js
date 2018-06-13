// router.js

const express = require('express');
const router = require('express').Router();
const compression = require('compression');
const config = require(process.cwd()+'/angular.json');


module.exports = function(app) {
  'use strict';
  let projectRoot = config.projects[config.defaultProject].architect.build.options.outputPath;
  // ROUTER CONFIG


  app.use(function(req, res, next) {

    // CAUTION: Wide open CORS!
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type');

    if (req.method == 'OPTIONS' ) {
      res.send(200);
    }
    else {
      next();
    }

  });


// ROUTES

  app.use(compression());

  app.use('/', express.static( process.cwd() + '/' + projectRoot ));


  app.get('*', function (req, res) {
    res.sendFile('index.html', { root: process.cwd() + '/' + projectRoot });
  });



  return router;

};
