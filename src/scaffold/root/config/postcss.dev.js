module.exports = {
  plugins: [
    require('postcss-filter-gradient'),
    require('autoprefixer')({ remove: false }),
    require('css-mqpacker')({ sort: true }),
    require('postcss-prettify')
  ]
}
