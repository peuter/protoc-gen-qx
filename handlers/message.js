const {getClassComment, getClassNamespace} = require('./base')
const {baseNamespace} = require('../config')
const typeMap = require('../types')

const genTypeClass = (type, s, proto) => {
  const properties = []
  const classNamespace = getClassNamespace(type, proto)

  let serializer = []
  let deserializer = []
  let constructorCode = []

  type.fieldList.forEach(prop => {
    let type = typeMap[prop.type]
    const list = prop.label === 3
    let upperCase = prop.name.substring(0, 1).toUpperCase() + prop.name.substring(1)
    if (!type && prop.typeName) {
      // reference to another proto message
      if (prop.type === 14) {
        // enum
        type = {
          qxType: 'Number',
          pbType: 'Enum',
          emptyComparison: ' !== 0.0'
        }
      } else if (prop.type === 11) {
        // reference
        type = {
          qxType: `${baseNamespace}${prop.typeName}`,
          readerCode: list ? `
          case ${prop.number}:
           var value = new ${baseNamespace}${prop.typeName};
            reader.readMessage(value, ${baseNamespace}${prop.typeName}.deserializeBinaryFromReader);
            msg.get${upperCase}().push(value);
            break;
          ` : `
          case ${prop.number}:
            var value = new ${baseNamespace}${prop.typeName};
            reader.readMessage(value, ${baseNamespace}${prop.typeName}.deserializeBinaryFromReader);
            msg.set${upperCase}(value);
            break;
          `,
          writerCode: list ? `
      f = message.get${upperCase}();
      if (f != null) {
        writer.writeRepeatedMessage(
          ${prop.number},
          f,
          ${baseNamespace}${prop.typeName}.serializeBinaryToWriter
        );
      }
      ` : `
      f = message.get${upperCase}();
      if (f != null) {
        writer.writeMessage(
          ${prop.number},
          f,
          ${baseNamespace}${prop.typeName}.serializeBinaryToWriter
        );
      }
      `,
          emptyComparison: ' !== null'
        }
      }
    }
    if (!type) {
      console.error('undefined type:', prop)
      return
    }

    if (list) {
      properties.push(`
    /**
     * @type {qx.data.Array<${type.qxType}>}
     */
    ${prop.name}: {
      check: 'qx.data.Array',
      deferredInit: true,
      event: 'change${upperCase}'
    }`)
      constructorCode.push(`this.init${upperCase}(new qx.data.Array());`)
    } else {
      properties.push(`
    ${prop.name}: {
      check: '${type.qxType}',
      init: ${prop.defaultValue !== undefined ? prop.defaultValue : null},
      event: 'change${upperCase}'
    }`)
    }

    if (type.writerCode) {
      serializer.push(type.writerCode)
    } else if (type.pbType) {
      if (list) {
        serializer.push(`
      f = message.get${upperCase}();
      if (f${type.emptyComparison}) {
         writer.writeRepeated${type.pbType}(
           ${prop.number},
           f
        );
      }
`)
      } else {
        serializer.push(`
      f = message.get${upperCase}();
      if (f${type.emptyComparison}) {
         writer.write${type.pbType}(
           ${prop.number},
           f
        );
      }
`)
      }
    }

    if (type.readerCode) {
      deserializer.push(type.readerCode)
    } else if (type.pbType) {
      if (list) {
        deserializer.push(`
          case ${prop.number}:
            var value = reader.read${type.pbType}();
            msg.get${upperCase}().push(value);
            break;
`)
      } else {
        deserializer.push(`
          case ${prop.number}:
            var value = reader.read${type.pbType}();
            msg.set${upperCase}(value);
            break;
`)
      }
    }
  })

  if (deserializer.length) {
    deserializer = `      while (reader.nextField()) {
        if (reader.isEndGroup()) {
          break;
        }
        var field = reader.getFieldNumber();
        switch (field) {
${deserializer.join('')}
          default:
            reader.skipField();
            break;
        }
      }
      return msg;
    `
  }

  if (constructorCode.length > 0) {
    // add constructor
    constructorCode = `
  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */
  construct: function (props) {
    ${constructorCode.join('\\\\n   ')}
    this.base(arguments, props);
  },
  `
  }

  const code = `${getClassComment(type, s, proto, 4)}
qx.Class.define('${classNamespace}', {
  extend: proto.core.BaseMessage,
  ${constructorCode}
  
  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */
  statics: {
    
    /**
     * Serializes the given message to binary data (in protobuf wire
     * format), writing to the given BinaryWriter.
     * @param {proto.core.BaseMessage} message
     * @param {jspb.BinaryWriter} writer
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    serializeBinaryToWriter: function (message, writer) {
      var f = undefined;
${serializer.join('')}
    },
    
    /**
     * Deserializes binary data (in protobuf wire format).
     * @param {jspb.ByteSource} bytes The bytes to deserialize.
     * @return {${classNamespace}}
     */
    deserializeBinary: function (bytes) {
      var reader = new jspb.BinaryReader(bytes);
      var msg = new ${classNamespace}();
      return ${classNamespace}.deserializeBinaryFromReader(msg, reader);
    },
    
    /**
     * Deserializes binary data (in protobuf wire format) from the
     * given reader into the given message object.
     * @param {${classNamespace}} msg The message object to deserialize into.
     * @param {jspb.BinaryReader} reader The BinaryReader to use.
     * @return {${classNamespace}}
     */
    deserializeBinaryFromReader: function (msg, reader) {
${deserializer}      
    }
  },
  
  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */
  properties: {
${properties.join(',')}
  }
})
`
  return {
    namespace: classNamespace,
    code: code
  }
}

module.exports = genTypeClass