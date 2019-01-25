/* eslint-env node */
'use strict';

module.exports = [
  {
    target: 'web',
    entry: './node_modules/@improbable-eng/grpc-web/dist/grpc-web-client.js',
    output: {
      library: 'grpc',
      libraryTarget: 'var',
      libraryExport: 'grpc',
      filename: 'grpc-web-client.js'
    },
    mode: 'production',
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
    mode: 'production',
    stats: 'errors-only'
  }
];
