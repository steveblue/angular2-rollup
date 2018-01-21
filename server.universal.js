require('zone.js/dist/zone-node');
const fs = require('fs');
const path = require('path');
const domino = require('domino');
const express = require('express');
const compression = require('compression');
const ngUniversal = require('@nguniversal/express-engine');
const { enableProdMode } = require('@angular/core');
const ServerAppModuleNgFactory = require('./dist/backend/bundle.server').ServerAppModuleNgFactory;

const app = express();
const serverConfig = {
    dev: require('./server.config.dev.js'),
    prod: require('./server.config.prod.js')
};
const env = process.env.NODE_ENV || 'prod';
const port = serverConfig[env].port || process.env.PORT;
const host = serverConfig[env].origin;
const template = fs.readFileSync(path.join(__dirname, 'dist', 'frontend', 'index.html')).toString();
const win = domino.createWindow(template);

// simulate window and document server side
global['window'] = win;
global['document'] = win.document;
Object.defineProperty(win.document.body.style, 'transform', {
    value: () => {
        return {
            enumerable: true,
            configurable: true
        };
    },
});

enableProdMode();

// config server to use compression, serve assets gzipped
app.use(compression());

// bootstrap app with ngUniversal
app.engine('html', ngUniversal.ngExpressEngine({
    bootstrap: ServerAppModuleNgFactory
}));

// set view engine
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'dist', 'frontend'));


// handle requests
app.get('*.*', express.static(path.join(__dirname, 'dist', 'frontend')));

app.get('*', (req, res) => {
    global['navigator'] = req['headers']['user-agent'];
    res.render('index', { req, res });
});

// listen on port
app.listen(port, () => {
    console.log(`listening on http://localhost:${port}`);
});