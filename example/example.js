var App = require('./App');
var React = require('react');

var addStylesheet = require('../src/helpers/addStylesheet');
var exampleStylesheet = require('file?name=[name]-[hash].css!./example.css');

document.addEventListener('DOMContentLoaded', () => {
  addStylesheet(exampleStylesheet);

  var rootNode = document.createElement('div');
  document.body.appendChild(rootNode);

  React.render(<App />, rootNode);
});