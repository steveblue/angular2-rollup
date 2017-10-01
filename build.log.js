"use strict";

const colors = require('colors');
const clim = require('clim');
const cons = clim();

const log = function (action, noun, next) {
    let a = action ? colors.dim(colors.white(action)) : '';
    let n = noun ? colors.dim(colors.white(noun)) : '';
    let x = next ? colors.dim(colors.white(next)) : '';
    cons.log(a + ' ' + n + ' ' + x);
};

const alert = function (noun, verb, action, next) {
    let n = noun ? colors.white(noun) : '';
    let v = verb ? colors.white(verb) : '';
    let a = action ? colors.white(action) : '';
    let x = next ? colors.dim(colors.white(next)) : '';
    cons.log(n + ' ' + v + ' ' + a + ' ' + x);
};

const warn = function (action, noun) {
    let a = action ? colors.red(action) : '';
    let n = noun ? colors.white(noun) : '';
    cons.warn(a + ' ' + n);
};


clim.getTime = function () {
    let now = new Date();
    return colors.gray(colors.dim('[' +
        (now.getHours() < 10 ? '0' : '') + now.getHours() + ':' +
        (now.getMinutes() < 10 ? '0' : '') + now.getMinutes() + ':' +
        (now.getSeconds() < 10 ? '0' : '') + now.getSeconds() + ']'));
};

clim.logWrite = function (level, prefixes, msg) {
    // Default implementation writing to stderr
    var line = clim.getTime() + " " + level;
    if (prefixes.length > 0) line += " " + prefixes.join(" ");

    line = colors.dim(line);
    line += " " + msg;
    process.stderr.write(line + "\n");

    // or post it web service, save to database etc...
};


module.exports = {
    log: log,
    warn: warn,
    alert: alert,
    colors: colors
};