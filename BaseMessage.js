/**
 * @asset(proto/*)
 */
qx.Class.define('proto.core.BaseMessage', {
  extend: qx.core.Object,
  type: 'abstract',

  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */
  construct: function (props) {
    this.base(arguments);
    if (props) {
      this.set(props);
    }
  },

  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */
  properties: {
    /**
     * is true if this object has been generated from a protobuf message
     */
    deserialized: {
      check: 'Boolean',
      init: false
    }
  },

  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */
  members: {
    /**
     * Creates an object representation of this proto suitable for use in Soy templates.
     * Field names that are reserved in JavaScript and will be renamed to pb_name.
     * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
     * For the list of reserved names please see:
     *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
     * @param opt_includeInstance {boolean} Whether to include the JSPB instance
     *     for transitional soy proto support: http://goto/soy-param-migration
     * @returns {!Object}
     */
    toObject: function (opt_includeInstance) {
      var obj = qx.util.Serializer.toNativeObject(this);
      if (opt_includeInstance === true) {
        obj.$jspbMessageInstance = this;
      }
      return obj;
    },

    /**
     * Serializes the message to binary data (in protobuf wire format).
     * @returns {Uint8Array}
     */
    serializeBinary: function () {
      var writer = new jspb.BinaryWriter();
      this.constructor.serializeBinaryToWriter(this, writer);
      return writer.getResultBuffer();
    },

    /**
     * Transforms any value to a string
     * @protected
     */
    _toString: function (value) {
      return '' + value
    }
  }//###DEFER###
})