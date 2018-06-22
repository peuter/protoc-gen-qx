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
goog.exportSymbol('proto.qx.date', null, global);
goog.exportSymbol('proto.qx.validate', null, global);

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


/**
 * A tuple of {field number, class constructor} for the extension
 * field named `date`.
 * @type {!jspb.ExtensionFieldInfo.<boolean>}
 */
proto.qx.date = new jspb.ExtensionFieldInfo(
    50001,
    {date: 0},
    null,
     /** @type {?function((boolean|undefined),!jspb.Message=): !Object} */ (
         null),
    0);

google_protobuf_descriptor_pb.FieldOptions.extensionsBinary[50001] = new jspb.ExtensionFieldBinaryInfo(
    proto.qx.date,
    jspb.BinaryReader.prototype.readBool,
    jspb.BinaryWriter.prototype.writeBool,
    undefined,
    undefined,
    false);
// This registers the extension field with the extended class, so that
// toObject() will function correctly.
google_protobuf_descriptor_pb.FieldOptions.extensions[50001] = proto.qx.date;


/**
 * A tuple of {field number, class constructor} for the extension
 * field named `validate`.
 * @type {!jspb.ExtensionFieldInfo.<string>}
 */
proto.qx.validate = new jspb.ExtensionFieldInfo(
    50002,
    {validate: 0},
    null,
     /** @type {?function((boolean|undefined),!jspb.Message=): !Object} */ (
         null),
    0);

google_protobuf_descriptor_pb.FieldOptions.extensionsBinary[50002] = new jspb.ExtensionFieldBinaryInfo(
    proto.qx.validate,
    jspb.BinaryReader.prototype.readString,
    jspb.BinaryWriter.prototype.writeString,
    undefined,
    undefined,
    false);
// This registers the extension field with the extended class, so that
// toObject() will function correctly.
google_protobuf_descriptor_pb.FieldOptions.extensions[50002] = proto.qx.validate;

goog.object.extend(exports, proto.qx);
