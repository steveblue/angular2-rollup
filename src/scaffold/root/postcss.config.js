module.exports = ctx => ({
    plugins: {
        'postcss-discard-comments': ctx.env === 'prod' ? {} : false,
        'autoprefixer': { remove: false },
        'css-mqpacker': { sort: true },
        'postcss-csso': ctx.env === 'prod' ? {} : false
    }
})
