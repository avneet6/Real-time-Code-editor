const path = require('path');

module.exports = {
  // ... other configurations
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'bundle.js',
  },
};
