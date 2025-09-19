const path = require('path');

module.exports = {
  entry: './renderer/js/xml-formatter-bundle.js',
  output: {
    filename: 'xml-formatter-bundle.dist.js',
    path: path.resolve(__dirname, 'renderer/js'),
    library: ['xmlFormatter'],
    libraryTarget: 'window',
  },
  mode: 'production',
};
