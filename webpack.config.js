var Clean = require('clean-webpack-plugin');
var path = require('path');

module.exports = {
  entry: {
    leaflet: './leaflet.js'
  },
  output: {
    path: path.join(__dirname, 'dist'),
    publicPath: '/dist/',
    filename: '[name].js'
  },
  resolve: {
    fallback: path.join(__dirname, 'node_modules')
  },
  resolveLoader: {
    fallback: path.join(__dirname, 'node_modules')
  },
  module: {
    loaders: [
      { test: /\.js$/, loader: 'babel', exclude: /node_modules/ }
    ]
  },
  plugins: [
    new Clean(['dist'])
  ]
};
