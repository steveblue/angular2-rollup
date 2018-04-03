# angular 6 closure example

This repo contains an example of how to bundle Angular 6.0.0-rc and rxjs 6.0.0-beta with Closure Compiler.

This project was built with the latest angular-rollup.

To build, clone the angular rollup repo and checkout the feature/next branch, then run `npm link`. 

node > 8.0.0 and < 9.0.0 has been tested.

- `git clone https://github.com/steveblue/angular2-rollup.git`
- `git checkout feature/next`
- `npm install`
- `npm link`


Clone this repo and install dependencies.

- `git clone https://github.com/steveblue/angular6-closure-example.git`
- `npm install`

`npm run rollup:closure` will generate FESM but we still need to trick closure into identifying the FESM as entry points.

Edit `node_modules/rxjs/package.json` and change the line that points to the es2015 bundle to now point to the FESM:

`"es2015": "./_fesm2015/index.js"`

Repeat for all rxjs modules. By default, only operators is needed by the typical @angular packages.

Edit node_modules/rxjs/operators/package.json.

`"es2015": "../_fesm2015/operators/index.js"`

This seems very hacky, but for now this is a viable method. Closure Compiler uses the package.json to identify where the FESM is located when using `--package_json_entry_names es2015`. 


`ngr build prod --serve` will generate the final bundle for the app and start the express server.

Open a browser to localhost:4200












