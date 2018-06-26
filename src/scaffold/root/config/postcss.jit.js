module.exports = {
  plugins: [
    require('autoprefixer')({ remove: false }),
    require('css-mqpacker')({ sort: true }),
    require('postcss-prettify')
  ]
}
