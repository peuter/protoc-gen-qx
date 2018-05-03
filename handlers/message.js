const {getClassComment, getClassNamespace} = require('./base')
const config = require('../config')
const baseNamespace = config.get('baseNamespace')
const typeMap = require('../types')
const lineEnd = config.get('withoutSemi') ? '' : ';'
const fs = require('fs')
const path = require('path')
const handlebars = require('handlebars')
const template = handlebars.compile(fs.readFileSync(path.join(__dirname, '..', 'templates', 'MessageClass.js.hbs'), 'utf8'))
handlebars.registerHelper('curly', function(object, open) {
  return open ? '{' : '}';
});

function setPropEntry(def, key, value) {
  let exists = false
  def.some(entry => {
    if (entry.key === key) {
      exists = true
      entry.value = value
      return true
    }
  })
  if (!exists) {
    def.push({key: key, value: value})
  }
}

const genTypeClass = (messageType, s, proto) => {
  const properties = []
  const classNamespace = getClassNamespace(messageType, proto)

  let serializer = []
  let deserializer = []
  let statics = []
  let constructorCode = []
  let oneOfs = []
  let memberCode = []
  let defers = []

  messageType.enumTypeList.forEach(entry => {
    let valueCode = []
    entry.valueList.forEach(enumValue => {
      valueCode.push(`${enumValue.name}: ${enumValue.number}`)
    })
    statics.push(`/**
     * @enum
     */
    ${entry.name}: {
      ${valueCode.join(',\n      ')}
    }`)
  })
  messageType.oneofDeclList.forEach((prop, i) => {
    let upperCase = prop.name.substring(0, 1).toUpperCase() + prop.name.substring(1)
    const index = oneOfs.length
    oneOfs.push(Object.assign({
      types: [],
      names: [],
      event: `change${upperCase}`
    }, prop))
    memberCode.push(`// oneOf property apply
    _applyOneOf${index}: function (value, old, name) {
      this.set${upperCase}(name)${lineEnd}
      
      // reset all other values
      ${classNamespace}.ONEOFS[${index}].forEach(function (prop) {
        if (prop !== name) {
          this.reset(prop)${lineEnd}
        }
      }, this)
    }`)
  })

  messageType.fieldList.forEach(prop => {
    let type = typeMap[prop.type]
    const list = prop.label === 3
    prop.comment = ''
    let upperCase = prop.name.substring(0, 1).toUpperCase() + prop.name.substring(1)
    let writerTransform = ''
    if (!type && prop.typeName) {
      // reference to another proto message
      if (prop.type === 14) {
        // enum
        type = {
          qxType: 'Number',
          pbType: 'Enum',
          emptyComparison: ' !== 0.0',
          comment: []
        }
        if (prop.defaultValue === undefined) {
          // according to protobuf spec enums default value is always 0
          prop.defaultValue = 0
        }
        if (prop.typeName) {
          prop.comment = [`Enum of type {@link ${baseNamespace}${prop.typeName}}`]
        }
      } else if (prop.type === 11) {
        // reference
        let qxType = baseNamespace + prop.typeName
        if (prop.typeName === '.google.protobuf.Timestamp') {
          config.set('timestampSupport', true)
          qxType = 'Date'
          writerTransform = `
      f = new ${baseNamespace}${prop.typeName}({seconds: '' + Math.round(f.getTime()/1000), nanos: (f.getTime() - Math.round(f.getTime()/1000) * 1000000)})${lineEnd}`
        }
        type = {
          qxType: `${qxType}`,
          readerCode: list ? `          case ${prop.number}:
            value = new ${baseNamespace}${prop.typeName}()${lineEnd}
            reader.readMessage(value, ${baseNamespace}${prop.typeName}.deserializeBinaryFromReader)${lineEnd}
            msg.get${upperCase}().push(value)${lineEnd}
            break${lineEnd}` : `          case ${prop.number}:
            value = new ${baseNamespace}${prop.typeName}()${lineEnd}
            reader.readMessage(value, ${baseNamespace}${prop.typeName}.deserializeBinaryFromReader)${lineEnd}
            msg.set${upperCase}(value)${lineEnd}
            break${lineEnd}`,
          writerCode: list ? `f = message.get${upperCase}().toArray()${lineEnd}
      if (f != null) {
        writer.writeRepeatedMessage(
          ${prop.number},
          f,
          ${baseNamespace}${prop.typeName}.serializeBinaryToWriter
        )${lineEnd}
      }` : `f = message.get${upperCase}()${lineEnd}${writerTransform}
      if (f != null) {
        writer.writeMessage(
          ${prop.number},
          f,
          ${baseNamespace}${prop.typeName}.serializeBinaryToWriter
        )${lineEnd}
      }`,
          emptyComparison: ' !== null'
        }
        if (prop.typeName === '.google.protobuf.Timestamp') {
          type.transform = '_transformTimestampToDate'
        }
      }
    }
    if (!type) {
      console.error('undefined type:', prop)
      return
    }
    if (prop.defaultValue === undefined && type.hasOwnProperty('defaultValue')) {
      // according to protobuf spec enums default value is always 0
      prop.defaultValue = type.defaultValue
    }
    let propertyDefinition = {
      comment: prop.comment,
      name: prop.name,
      entries: []
    }

    if (list) {
      propertyDefinition.comment = [`@type {qx.data.Array} array of {@link ${type.qxType}}`]
      propertyDefinition.entries = propertyDefinition.entries.concat([
          {key: 'check', value: `'qx.data.Array'`},
          {key: 'deferredInit', value: true},
          {key: 'event', value: `'change${upperCase}'`}
      ])
      constructorCode.push(`this.init${upperCase}(new qx.data.Array())${lineEnd}`)
    } else {
      propertyDefinition.entries = propertyDefinition.entries.concat([
        {key: 'check', value: `'${type.qxType}'`},
        {key: 'init', value: prop.defaultValue !== undefined ? prop.defaultValue : 'null'},
        {key: 'nullable', value: prop.defaultValue === undefined},
        {key: 'event', value: `'change${upperCase}'`}
      ])
    }

    if (prop.hasOwnProperty('oneofIndex') && prop.oneofIndex !== undefined) {
      const oneOf = oneOfs[prop.oneofIndex]
      oneOf.types.push(prop.type)
      oneOf.names.push(prop.name)
      propertyDefinition.entries.push({key: 'apply', value: `'_applyOneOf${prop.oneofIndex}'`})
    }

    if (type.hasOwnProperty('transform')) {
      propertyDefinition.entries.push({key: 'transform', value: `'${type.transform}'`})
    }

    if (prop.options) {
      if (prop.options.hasOwnProperty('annotations')) {
        propertyDefinition.entries.push({key: `'@'`, value: `['${prop.options.annotations.split(',').map(x => x.trim()).join('\', \'')}']`})
      }
      if (prop.options.hasOwnProperty('date') && prop.options.date === true) {
        setPropEntry(propertyDefinition.entries, 'transform', `'_toDate'`)
        setPropEntry(propertyDefinition.entries, 'check', `'Date'`)
      }
    }
    properties.push(propertyDefinition)

    if (type.writerCode) {
      serializer.push(type.writerCode)
    } else if (type.pbType) {
      if (list) {
        serializer.push(`f = message.get${upperCase}()${lineEnd}
      if (f${type.emptyComparison}) {
        writer.writeRepeated${type.pbType}(
          ${prop.number},
          f
        )${lineEnd}
      }`)
      } else {
        serializer.push(`f = message.get${upperCase}()${lineEnd}
      if (f${type.emptyComparison}) {
        writer.write${type.pbType}(
          ${prop.number},
          f
        )${lineEnd}
      }`)
      }
    }

    if (type.readerCode) {
      deserializer.push(type.readerCode)
    } else if (type.pbType) {
      if (list) {
        deserializer.push(`          case ${prop.number}:
            value = reader.read${type.pbType}()${lineEnd}
            msg.get${upperCase}().push(value)${lineEnd}
            break${lineEnd}`)
      } else {
        deserializer.push(`          case ${prop.number}:
            value = reader.read${type.pbType}()${lineEnd}
            msg.set${upperCase}(value)${lineEnd}
            break${lineEnd}`)
      }
    }
  })

  oneOfs.forEach((oneOf, index) => {
    // try to find a matching type superset
    let complexType = true
    oneOf.types.some(entry => {
      if (entry !== 11) {
        complexType = false
        return true
      }
    })
    const firstUp = oneOf.name.substring(0, 1).toUpperCase() + oneOf.name.substring(1)
    // experimental add a shortcut function to generically set the oneof object
    if (complexType) {
      memberCode.push(`/**
     * Set value for oneOf field '${oneOf.name}'. Tries to detect the object type and call the correct setter.
     * @param obj {var}
     */
    setOneOf${firstUp}: function (obj) {
      var type = obj.basename.toLowerCase()${lineEnd}
      if (${classNamespace}.ONEOFS[${index}].includes(type)) {
        this.set(type, obj)${lineEnd}
      } else {
        throw new Error('type ' + type + ' is invalid for ${oneOf.name}, allowed types are: ' + ${classNamespace}.ONEOFS[${index}].join(', '))${lineEnd}
      }
    }`)
      statics.push(`/**
     * Returns the allowed type for the oneOf field '${oneOf.name}'.
     * @returns {Array} array of type names as string
     */
    getAllowedTypesOf${firstUp}: function () {
      return this.ONEOFS[${index}]${lineEnd}
    }`)
    }

    memberCode.push(`/**
     * Get value for oneOf field '${oneOf.name}'.
     * @returns {var}
     */
    getOneOf${firstUp}: function () {
      if (this.get${firstUp}()) {
        return this.get(this.get${firstUp}())${lineEnd}
      }
      return null${lineEnd}
    }`)

    const propDef = {
      comment: [`oneOfIndex: ${index}`],
      name: oneOf.name,
      entries: [
        {key: 'init', value: oneOf.defaultValue !== undefined ? oneOf.defaultValue : 'null'},
        {key: 'event', value: `'${oneOf.event}'`}
      ]
    }
    propDef.entries.unshift({key: 'check', value: `['${oneOf.names.join('\', \'')}']`})
    properties.push(propDef)

    // write the one of members
    if (index === 0) {
      statics.unshift(`// array with oneOf property groups
    ONEOFS: []`)
    }
    defers.push(`statics.ONEOFS[${index}] = ['${oneOf.names.join('\', \'')}']${lineEnd}`)
  })

  if (deserializer.length) {
    deserializer = `msg.setDeserialized(true)${lineEnd}
      while (reader.nextField()) {
        if (reader.isEndGroup()) {
          break${lineEnd}
        }
        var value${lineEnd}
        var field = reader.getFieldNumber()${lineEnd}
        switch (field) {
${deserializer.join('\n')}
          default:
            reader.skipField()${lineEnd}
            break${lineEnd}
        }
      }
      return msg${lineEnd}`
  }

  // class basics
  let initCode = [`extend: ${config.getExtend('messageType', classNamespace)}`]
  const includes = config.getIncludes('messageType', classNamespace)
  if (includes.length) {
    initCode.push(`include: [${includes.join(', ')}]`)
  }
  const interfaces = config.getImplements('messageType', classNamespace)
  if (interfaces.length) {
    initCode.push(`implement: [${interfaces.join(', ')}]}`)
  }

  if (serializer.length) {
    serializer[0] = `var ${serializer[0].trim()}`
  }

  const code = template({
    classComment: getClassComment(messageType, s, proto, 4),
    classNamespace: classNamespace,
    initCode: initCode,
    constructorCode: constructorCode,
    statics: statics,
    serializer: serializer,
    deserializer: deserializer,
    properties: properties,
    members: memberCode,
    defers: defers,
    lineEnd: lineEnd
  })
  return {
    namespace: classNamespace,
    code: code
  }
}

module.exports = genTypeClass
