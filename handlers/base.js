const protocPlugin = require('protoc-plugin')
const findCommentByPath = protocPlugin.findCommentByPath
const config = require('../config')
const baseNamespace = config.get('baseNamespace')

const getClassComment = (item, s, proto, commentPos) => {
  return `
/**
 * ${item.name} class generated from protobuf definition "${proto.name}".
${normalizeComments(findCommentByPath([commentPos, s], proto.sourceCodeInfo.locationList), 1)}
 * auto-generated code PLEASE DO NOT EDIT!
 */`
}

const getClassNamespace = (item, proto, relNamespace) => {
  if (relNamespace) {
    return `${relNamespace}.${item.name}`
  }
  return `${baseNamespace}.${proto.pb_package}.${item.name}`
}

const normalizeComments = (comment, indent) => {
  let res = []
  comment.split('\n').forEach((line, index) => {
    if ((!line || line.trim() === '*') && index === 0) {
      // skip empty trailing lines
      return
    }
    line = line.trim()
    if (!line.startsWith('*')) {
      line = '* ' + line
    }
    res.push(''.padStart(indent, ' ') + line)
  })
  if (res.length === 0) {
    return ''.padStart(indent, ' ') + '*'
  }
  return res.join('\n')
}

module.exports = {
  getClassComment: getClassComment,
  getClassNamespace: getClassNamespace,
  normalizeComments: normalizeComments
}