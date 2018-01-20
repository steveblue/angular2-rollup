require('zone.js/dist/zone-node');
const domino = require('domino');
const express = require('express');
const compression = require('compression');
const ngUniversal = require('@nguniversal/express-engine');
const fs = require('fs');
const path = require('path');
const { platformServer, renderModuleFactory } = require('@angular/platform-server');
const { enableProdMode } = require('@angular/core');
const ServerAppModuleNgFactory = require('./ngfactory/src/app/app.server.module.ngfactory').ServerAppModuleNgFactory;
const template = fs.readFileSync(path.join(__dirname, 'build', 'index.html')).toString();
const win = domino.createWindow(template);
const PORT = 4000;

global['window'] = win;
Object.defineProperty(win.document.body.style, 'transform', {
    value: () => {
        return {
            enumerable: true,
            configurable: true
        };
    },
});
global['document'] = win.document;

enableProdMode();

const app = express();
app.use(compression());

app.engine('html', ngUniversal.ngExpressEngine({
    bootstrap: ServerAppModuleNgFactory
}));

app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'build'))

app.get('*.*', express.static(path.join(__dirname, 'build')));

app.get('*', (req, res) => {
    global['navigator'] = req['headers']['user-agent'];
    res.render('index', { req, res });
});

app.listen(PORT, () => {
    console.log(`listening on http://localhost:${PORT}`);
});