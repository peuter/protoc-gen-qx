# Create Qooxdoo classes from proto files

protoc-gen-qx is a plugin for the `protoc` code generator. It creates
qooxdoo class definitions from proto-files.

The generated code can be uses as any other external library, by including
it in your compile.json/config.json.

Usage:

```sh
$ protoc \
    -Iproto \
    --plugin=protoc-gen-qx=./external/protoc-gen-qx/index.js \
    --qx_out=generated \
    api.proto
```

This example generate an external qooxdoo library from the `api.proto`
file in the `proto` subfolder. You can include this library in your
project by adding it as external library. e.g (add this code to your
config.json).

```json
"libraries": {
  "library": [
    {
      "manifest" : "./generated/Manifest.json"
    }
  ]
}
```

## Requirements

The generated code has two dependencies, which can both be installed
via npm:

```sh
npm -i -s google-protobuf
npm -i -s grpc-web-client
```

1. google-protobuf
2. gRPC Web implementation by improbable (https://github.com/improbable-eng/grpc-web)