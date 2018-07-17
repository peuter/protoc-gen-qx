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
const {setPropEntry} = require('../utils')
const arrayClass = config.get('repeatedClass')
const optionHandler = require('./options/index')

const genTypeClass = (messageType, s, proto, relNamespace) => {
  const classNamespace = getClassNamespace(messageType, proto, relNamespace)
  if (messageType.name === 'Any') {
    const anyTemplate = handlebars.compile(fs.readFileSync(path.join(__dirname, '..', 'templates', 'Any.js.hbs'), 'utf8'))
    const code = anyTemplate({
      baseNamespace: baseNamespace,
      lineEnd: lineEnd
    })
  
    return [{
      namespace: classNamespace,
      code: code
    }]
  }

  // all the information needed to generate the code
  const context = {
    requirements: [],
    includes: config.getIncludes('messageType', classNamespace).slice(),
    implements: config.getImplements('messageType', classNamespace).slice(),
    constructor: [],
    statics: [],
    properties: [],
    preSerializer: '',
    serializer: [],
    postSerializer: '',
    deserializer: [],
    oneOfs: [],
    members: [],
    defers: [],
    lineEnd: lineEnd,
    baseNamespace: baseNamespace
  }

  messageType.enumTypeList.forEach(entry => {
    let valueCode = []
    entry.valueList.forEach(enumValue => {
      valueCode.push(`${enumValue.name}: ${enumValue.number}`)
    })
    context.statics.push(`/**
     * @enum
     */
    ${entry.name}: {
      ${valueCode.join(',\n      ')}
    }`)
  })
  messageType.oneofDeclList.forEach((prop, i) => {
    let upperCase = prop.name.substring(0, 1).toUpperCase() + prop.name.substring(1)
    const index = context.oneOfs.length
    context.oneOfs.push(Object.assign({
      types: [],
      refs: [],
      names: [],
      event: `change${upperCase}`
    }, prop))
  })

  messageType.fieldList.forEach(prop => {
    const list = prop.label === 3
    const propertyDefinition = {
      comment: '',
      name: prop.name,
      entries: [],
      serializer: [],
      deserializer: [],
      type: typeMap[prop.type] ? Object.assign({}, typeMap[prop.type]) : null,
      writerTransform: ''
    }
    // add writer tronform from type definition
    if (propertyDefinition.type && propertyDefinition.type.writerTransform) {
      propertyDefinition.writerTransform += `
      ${propertyDefinition.type.writerTransform}${lineEnd}`
    }
    let upperCase = prop.name.substring(0, 1).toUpperCase() + prop.name.substring(1)
    let isMap = false
    if (!propertyDefinition.type && prop.typeName) {
      // reference to another proto message
      if (prop.type === 14) {
        // enum
        propertyDefinition.type = {
          qxType: 'Number',
          pbType: 'Enum',
          emptyComparison: ' !== 0.0',
          comment: [],
          packed: true
        }
        if (prop.defaultValue === undefined) {
          // according to protobuf spec enums default value is always 0
          prop.defaultValue = 0
        }
        if (prop.typeName) {
          propertyDefinition.comment = [`Enum of type {@link ${baseNamespace}${prop.typeName}}`]
        }
      } else if (prop.type === 11) {
        // reference
        
        // check if reference is to a nestedType
        const completeType = `${baseNamespace}${prop.typeName}`
        if (completeType.startsWith(classNamespace + '.')) {
          const className = classNamespace.split('.').pop()

          // find the nestedType declaration
          const nestedTypeName = prop.typeName.split('.').pop();
          const nestedType = messageType.nestedTypeList.find(nType => nType.name === nestedTypeName);
          
          // check if this is a map type
          isMap = nestedType && nestedType.options && nestedType.options.mapEntry === true
          if (isMap) {
            context.members.push(`/**
     * Get ${prop.name} map entry by key.
     * 
     * @param key {String} map key
     * @returns {var|null} map value if the key exists in the map
     */
    get${upperCase}ByKey: function (key) {
      return this.get${upperCase}().toArray().find(function (mapEntry) {
        return mapEntry.getKey() === key${lineEnd}
      }, this)${lineEnd}
    }`)
          }
          prop.typeName = prop.typeName.replace(`.${className}.`, `.${className.substring(0, 1).toLowerCase()}${className.substring(1)}.`)
          // add to requirements
          context.requirements.push(`@require(${baseNamespace}${prop.typeName})`)
        }
        let qxType = baseNamespace + prop.typeName
        if (prop.typeName === '.google.protobuf.Timestamp') {
          config.set('timestampSupport', true)
          qxType = 'Date'
          propertyDefinition.writerTransform = `
      f = new ${baseNamespace}${prop.typeName}({seconds: '' + Math.round(f.getTime()/1000), nanos: (f.getTime() - Math.round(f.getTime()/1000) * 1000000)})${lineEnd}`
        }
        propertyDefinition.type = {
          qxType: `${qxType}`,
          readerCode: list ? `case ${prop.number}:
            value = new ${baseNamespace}${prop.typeName}()${lineEnd}
            reader.readMessage(value, ${baseNamespace}${prop.typeName}.deserializeBinaryFromReader)${lineEnd}
            msg.get${upperCase}().push(value)${lineEnd}
            break${lineEnd}` : `case ${prop.number}:
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
      }` : `f = message.get${upperCase}()${lineEnd}${propertyDefinition.writerTransform}
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
          propertyDefinition.type.transform = '_transformTimestampToDate'
        }
      }
    }
    if (!propertyDefinition.type) {
      console.error('undefined type:', prop)
      return
    }

    if (prop.defaultValue === undefined && propertyDefinition.type.hasOwnProperty('defaultValue')) {
      // according to protobuf spec enums default value is always 0
      prop.defaultValue = propertyDefinition.type.defaultValue
    }

    if (list) {
      propertyDefinition.comment = [`@type {${arrayClass}} array of {@link ${propertyDefinition.type.qxType}}`]
      propertyDefinition.entries = propertyDefinition.entries.concat([
          {key: 'check', value: `'${arrayClass}'`},
          {key: 'deferredInit', value: true},
          {key: 'event', value: `'change${upperCase}'`}
      ])
      context.constructor.push(`this.init${upperCase}(new ${arrayClass}())${lineEnd}`)
    } else {
      propertyDefinition.entries = propertyDefinition.entries.concat([
        {key: 'check', value: `'${propertyDefinition.type.qxType}'`},
        {key: 'init', value: prop.defaultValue !== undefined ? prop.defaultValue : 'null'},
        {key: 'nullable', value: prop.defaultValue === undefined},
        {key: 'event', value: `'change${upperCase}'`}
      ])
    }
    if (prop.hasOwnProperty('oneofIndex') && prop.oneofIndex !== undefined) {
      const oneOf = context.oneOfs[prop.oneofIndex]
      oneOf.types.push(prop.type)
      oneOf.names.push(prop.name)
      if (prop.type === 11) {
        // reference
        oneOf.refs.push(`${baseNamespace}${prop.typeName}`)
      } else {
        oneOf.refs.push('')
      }
      setPropEntry(propertyDefinition.entries, 'apply', `'_applyOneOf${prop.oneofIndex}'`)
    }

    if (propertyDefinition.type.hasOwnProperty('transform')) {
      setPropEntry(propertyDefinition.entries, 'transform', `'${propertyDefinition.type.transform}'`)
    }

    if (prop.options) {
      optionHandler.process(prop.options, propertyDefinition, context)
    }
    context.properties.push(propertyDefinition)

    if (propertyDefinition.type.writerCode) {
      propertyDefinition.serializer.push(propertyDefinition.type.writerCode)
    } else if (propertyDefinition.type.pbType) {
      if (list) {
        const writeMethod = propertyDefinition.type.packed ? `writePacked${propertyDefinition.type.pbType}` : `writeRepeated${propertyDefinition.type.pbType}`
        propertyDefinition.serializer.push(`f = message.get${upperCase}().toArray()${lineEnd}
      if (f${propertyDefinition.type.emptyComparison}) {
        writer.${writeMethod}(
          ${prop.number},
          f
        )${lineEnd}
      }`)
      } else {
        propertyDefinition.serializer.push(`f = message.get${upperCase}()${lineEnd}${propertyDefinition.writerTransform}
      if (f${propertyDefinition.type.emptyComparison}) {
        writer.write${propertyDefinition.type.pbType}(
          ${prop.number},
          f
        )${lineEnd}
      }`)
      }
    }

    if (propertyDefinition.type.readerCode) {
      propertyDefinition.deserializer.push(propertyDefinition.type.readerCode)
    } else if (propertyDefinition.type.pbType) {
      if (list) {
        if (propertyDefinition.type.packed) {
          propertyDefinition.deserializer.push(`case ${prop.number}:
            value = reader.readPacked${propertyDefinition.type.pbType}()${lineEnd}
            msg.get${upperCase}().replace(value)${lineEnd}
            break${lineEnd}`)
        } else {
          propertyDefinition.deserializer.push(`case ${prop.number}:
            value = reader.read${propertyDefinition.type.pbType}()${lineEnd}
            msg.get${upperCase}().push(value)${lineEnd}
            break${lineEnd}`)
        }
      } else {
        propertyDefinition.deserializer.push(`case ${prop.number}:
            value = reader.read${propertyDefinition.type.pbType}()${lineEnd}
            msg.set${upperCase}(value)${lineEnd}
            break${lineEnd}`)
      }
    }
  })

  context.oneOfs.forEach((oneOf, index) => {
    // try to find a matching type superset
    let complexType = true
    console.error(oneOf.name)
    oneOf.types.some(entry => {
      console.error(entry);
      if (entry !== 11) {
        complexType = false
        return true
      }
    })
    const firstUp = oneOf.name.substring(0, 1).toUpperCase() + oneOf.name.substring(1)
    // experimental add a shortcut function to generically set the oneof object
    if (complexType) {
      context.members.push(`/**
     * Set value for oneOf field '${oneOf.name}'. Tries to detect the object type and call the correct setter.
     * @param obj {var}
     */
    setOneOf${firstUp}: function (obj) {
      if (${classNamespace}.ONEOFS[${index}].hasOwnProperty(obj.classname)) {
        this.set(${classNamespace}.ONEOFS[${index}][obj.classname], obj)${lineEnd}
      } else {
        throw new Error('type ' + obj.classname + ' is invalid for ${oneOf.name}, allowed types are: ' + Object.keys(${classNamespace}.ONEOFS[${index}]).join(', '))${lineEnd}
      }
    }`)
      context.statics.push(`/**
     * Returns the allowed type for the oneOf field '${oneOf.name}'.
     * @returns {Array} array of type names as string
     */
    getAllowedTypesOf${firstUp}: function () {
      return Object.values(this.ONEOFS[${index}])${lineEnd}
    }`)
      context.defers.push(`statics.ONEOFS[${index}] = ${JSON.stringify(Object.assign({}, ...oneOf.refs.map((n, index) => ({[n]: oneOf.names[index]}))))}${lineEnd}`)
      context.members.push(`// oneOf property apply
    _applyOneOf${index}: function (value, old, name) {
      this.set${firstUp}(name)${lineEnd}
      
      // reset all other values
      Object.values(${classNamespace}.ONEOFS[${index}]).forEach(function (prop) {
        if (prop !== name) {
          this.reset(prop)${lineEnd}
        }
      }, this)
    }`)
    } else {
      context.defers.push(`statics.ONEOFS[${index}] = ${JSON.stringify(oneOf.names)}${lineEnd}`)
      context.members.push(`// oneOf property apply
    _applyOneOf${index}: function (value, old, name) {
      this.set${firstUp}(name)${lineEnd}
      
      // reset all other values
      ${classNamespace}.ONEOFS[${index}].forEach(function (prop) {
        if (prop !== name) {
          this.reset(prop)${lineEnd}
        }
      }, this)
    }`)
    }

    context.members.push(`/**
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
    context.properties.push(propDef)

    // write the one of members
    if (index === 0) {
      context.statics.unshift(`// array with maps with oneOf referenced type as key and property name as value
    ONEOFS: []`)
    }
  })

  // extract (de-)serializer entries from the properties
  let deserializer = context.properties.filter(entry => entry.deserializer && entry.deserializer.length).map(entry => entry.deserializer.join('\n'))
  let serializer = context.properties.filter(entry => entry.serializer && entry.serializer.length).map(entry => entry.serializer.join('\n'))

  // class basics
  let initCode = [`extend: ${config.getExtend('messageType', classNamespace)}`]
  if (context.includes.length) {
    initCode.push(`include: [${context.includes.join(', ')}]`)
  }
  if (context.implements.length) {
    initCode.push(`implement: [${context.implements.join(', ')}]`)
  }

  if (serializer.length) {
    serializer[0] = `var ${serializer[0].trim()}`
  }

  const code = template({
    classComment: getClassComment(messageType, s, proto, 4, context.requirements),
    classNamespace: classNamespace,
    initCode: initCode,
    constructorCode: context.constructor,
    statics: context.statics,
    serializer: serializer,
    preSerializer: context.preSerializer,
    deserializer: deserializer,
    postSerializer: context.postSerializer,
    properties: context.properties,
    members: context.members,
    defers: context.defers,
    lineEnd: lineEnd
  })

  let result = [{
    namespace: classNamespace,
    code: code
  }]

  // nested types
  messageType.nestedTypeList.forEach(nestedEntry => {
    // lowercase class name to avoid overriding class
    let parts = classNamespace.split('.')
    let className = parts.pop()
    const subpackage = parts.join('.') + '.' + className.substring(0, 1).toLowerCase() + className.substring(1)
    result = result.concat(genTypeClass(nestedEntry, s, proto, subpackage))
  })

  return result
}

module.exports = genTypeClass
