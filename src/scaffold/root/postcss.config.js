module.exports = ctx => ({
    plugins: {
        'postcss-discard-comments': ctx.env === 'production' ? {} : false,
        'autoprefixer': { remove: false },
        'css-mqpacker': { sort: true },
        'postcss-csso': ctx.env === 'production' ? {} : false
    }
})
