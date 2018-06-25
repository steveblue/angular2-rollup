// rollup.config.js

import nodeResolve from 'rollup-plugin-node-resolve';

class ResolveRxjs {

    resolveId(importee, importer) {
        if (importee.startsWith('rxjs')) {
            let pkg = importee.replace('rxjs', '');
            if (importee.includes('/')) {
                return `node_modules/rxjs/_fesm2015${pkg}/index.js`;
            } else {
                return `node_modules/rxjs/_fesm2015/${pkg}index.js`;
            }
        }
    }
}


class ResolveAngular {

    resolveId(importee, importer) {
        if (importee.startsWith('@angular')) {
            let pkg = importee.replace('@angular', '');
            if (importee.split('/').length > 2) {
                return `node_modules/${importee.split('/')[0]}/${importee.split('/')[1]}/fesm2015/${importee.split('/')[2]}.js`;
            } else {
                return `node_modules/${importee}/fesm2015${pkg}.js`;
            }
        }
    }
}


export default {
    input: 'main.js',
    treeshake: true,
    output: {
        file: 'dist/{{projectName}}/bundle.es2015.js',
        format: 'iife'
    },
    plugins: [
        new ResolveRxjs(),
        new ResolveAngular(),
        nodeResolve({
            module: true,
            jsnext: true
        })
    ],
    onwarn: function (message) {

        console.log(message);

    }
}
