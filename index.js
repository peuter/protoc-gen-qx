#! /usr/bin/env node

/* eslint-env es6, node */
const protocPlugin = require('protoc-plugin');
const findCommentByPath = protocPlugin.findCommentByPath;
const fs = require('fs')
const path = require('path')
const {baseNamespace} = require('./config')
const handlers = {
  serviceList: require('./handlers/service'),
  enumTypeList: require('./handlers/enum'),
  messageTypeList: require('./handlers/message')
}

const baseServiceClass = fs.readFileSync(path.resolve(__dirname, './BaseService.js'), 'utf8')
baseServiceClass.replace(/qx.Class.define\('proto.core/, `qx.Class.define('${baseNamespace}.core`)

const baseMessageClass = fs.readFileSync(path.resolve(__dirname, './BaseMessage.js'), 'utf8')
baseMessageClass.replace(/qx.Class.define\('proto.core/, `qx.Class.define('${baseNamespace}.core`)

protocPlugin(protos => {
  // do stuff here with protos
  // return array like [{name: 'filename', content: 'CONTENTS'}]
  const files = [{
    name: `source/class/${baseNamespace}/core/BaseService.js`,
    content: baseServiceClass
  }, {
    name: `source/class/${baseNamespace}/core/BaseMessage.js`,
    content: baseMessageClass
  }, {
    name: 'Manifest.json',
    content: `{
  "info": {},
  "provides": {
    "namespace"   : "${baseNamespace}",
    "encoding"    : "utf-8",
    "class"       : "source/class",
    "type"        : "library"
  }
}`
  }]

  protos.forEach(proto => {
    Object.keys(handlers).forEach( propName => {
      if (proto[propName]) {
        proto[propName].forEach((item, s) => {
          const {namespace, code} = handlers[propName](item, s, proto)
          files.push({
            name: `source/class/${namespace.split('.').join('/')}.js`,
            content: code
          })
        })
      }
    })

    // console.error(proto,'\n\n')
    if (proto.messageList) {
      proto.messageList.forEach((message, m) => {
        console.error('MESSAGE', message.name, findCommentByPath([4, m], proto.sourceCodeInfo.locationList))
        message.fieldList.forEach((field, f) => {
          console.error('FIELD', field.name, findCommentByPath([4, m, 2, f], proto.sourceCodeInfo.locationList))
        })
      })
    }
  })

  // no files written
  return files
})
