# Create Qooxdoo classes from proto files

protoc-gen-qx is a plugin for the `protoc` code generator. It creates
qooxdoo class definitions from proto-files.

The generated code can be uses as any other external library, by including
it in your compile.json/config.json.

Usage:

```sh
$ protoc \
    -Iproto \
    --plugin=protoc-gen-qx=./node-modules/.bin/protoc-gen-qx \
    --qx_out=generated \
    api.proto
```

> If you add this code as a script entry in you package.json or install the protoc-gen-qx
> plugin globally, you do not have to define the plugin path.
> ```json
> "scripts": {
>    "protogen": "protoc -Iproto --qx_out=generated api.proto"
>  }
>```
> Excecute the script with `npm run protogen`


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

## Notes

The generated code has two dependencies, which are both automatically loaded in the defer method
of the BaseMessage class in the generated code. As both libraries do not provide as browser-ready,
this plugin uses webpack to convert them.

1. google-protobuf (https://www.npmjs.com/package/google-protobuf)
2. gRPC Web implementation by improbable (https://www.npmjs.com/package/grpc-web-client)

## Plugin parameters

You can add parameters to the plugin call by using the following format:

`--qx_out=paramName=paramValue,booleanParam:<output-path>`

The plugin reads the following parameters:

`skipDeps`:
A boolean parameter which disabled the external dependency generation.
Usually those script have only to be generated once, so you can skip
this step in further code generation calls to save some time.

Example:
```sh
$ protoc \
    -Iproto \
    --plugin=protoc-gen-qx=./node-modules/.bin/protoc-gen-qx \
    --qx_out=skipDeps:generated \
    api.proto
```

`dump`:
Dumps the parsed proto files as JSON-String.