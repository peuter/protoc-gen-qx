const protocPlugin = require('protoc-plugin')
const findCommentByPath = protocPlugin.findCommentByPath
const config = require('../config')
const baseNamespace = config.get('baseNamespace')

const getClassComment = (item, s, proto, commentPos) => {
  return `
/**
 * ${item.name} class generated from protobuf definition "${proto.name}".
 * ${findCommentByPath([commentPos, s], proto.sourceCodeInfo.locationList)}
 * auto-generated code PLEASE DO NOT EDIT!
 */  
`
}

const getClassNamespace = (item, proto) => {
  return `${baseNamespace}.${proto.pb_package}.${item.name}`
}

module.exports = {
  getClassComment: getClassComment,
  getClassNamespace: getClassNamespace
}