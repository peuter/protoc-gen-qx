/**
 * @fileoverview
 * @enhanceable
 * @suppress {messageConventions} JS Compiler reports an error if a variable or
 *     field starts with 'MSG_' and isn't a translatable message.
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!

var jspb = require('google-protobuf');
var goog = jspb;
var global = Function('return this')();

var google_protobuf_descriptor_pb = require('google-protobuf/google/protobuf/descriptor_pb.js');
goog.exportSymbol('proto.qx.annotations', null, global);

/**
 * A tuple of {field number, class constructor} for the extension
 * field named `annotations`.
 * @type {!jspb.ExtensionFieldInfo.<string>}
 */
proto.qx.annotations = new jspb.ExtensionFieldInfo(
    50000,
    {annotations: 0},
    null,
     /** @type {?function((boolean|undefined),!jspb.Message=): !Object} */ (
         null),
    0);

google_protobuf_descriptor_pb.FieldOptions.extensionsBinary[50000] = new jspb.ExtensionFieldBinaryInfo(
    proto.qx.annotations,
    jspb.BinaryReader.prototype.readString,
    jspb.BinaryWriter.prototype.writeString,
    undefined,
    undefined,
    false);
// This registers the extension field with the extended class, so that
// toObject() will function correctly.
google_protobuf_descriptor_pb.FieldOptions.extensions[50000] = proto.qx.annotations;

goog.object.extend(exports, proto.qx);
