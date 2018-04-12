/* eslint-env node */
'use strict';

module.exports = [
  {
    target: 'web',
    entry: './node_modules/grpc-web-client/dist/index.js',
    output: {
      library: 'grpc',
      libraryTarget: 'var',
      libraryExport: 'grpc',
      filename: 'grpc-web-client.js'
    },
    plugins: [],
    stats: 'errors-only'
  },
  {
    target: 'web',
    entry: './node_modules/google-protobuf/google-protobuf.js',
    output: {
      library: 'jspb',
      libraryTarget: 'var',
      filename: 'google-protobuf.js'
    },
    stats: 'errors-only'
  }
];
