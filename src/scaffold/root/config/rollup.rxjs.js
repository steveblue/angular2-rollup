export default [{
    input: 'node_modules/rxjs/_esm2015/index.js',
    output: {
        file: 'node_modules/rxjs/_fesm2015/index.js',
        format: 'es'
    }
},
{
    input: 'node_modules/rxjs/_esm2015/operators/index.js',
    output: {
        file: 'node_modules/rxjs/_fesm2015/operators/index.js',
        format: 'es'
    }
}
];