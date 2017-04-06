const path = require("path");
const webpack = require("webpack");

module.exports = {
  entry: path.join(__dirname, "src", "index.js"),

  output: {
    filename: "index.js",
    path: path.join(__dirname, "lib"),
    library: 'ReduxPreload',
    libraryTarget: 'umd',
  },
  module: {
    loaders: [{
      test: /\.js$/,
      use: "babel-loader"
    }]
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
    }),
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        pure_getters: true,
        unsafe: true,
        unsafe_comps: true,
        screw_ie8: true,
        warnings: false,
      },
    })
  ]
}