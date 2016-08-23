var config = require('./static.config.js');
var ncp = require('ncp').ncp;
var mkdirp = require('mkdirp');

// create the desired folder in /dist

mkdirp(config.dist, function(err) { 

    if (err) {
        return console.error(err);
    }

});


// loop through dependencies and copy them

for( var i=0;  i < config.dep.length; i++ ) {

    console.log('Copying static dependency: ' + config.dep[i] + ' from ' + config.src + '/' + config.dep[i] + ' to ' + config.dist + '/' + config.dep[i] + '. Please include dependency in <head> of index.html.');    

    ncp(config.src + '/' + config.dep[i], config.dist + '/' + config.dep[i], function (err) {
        if (err) {
            return console.error(err);
        }

    });

}
