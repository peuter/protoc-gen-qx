const protocPlugin = require('protoc-plugin')
const findCommentByPath = protocPlugin.findCommentByPath
const {getClassComment, getClassNamespace} = require('./base')
const {baseNamespace} = require('../config')

const genServiceClass = (service, s, proto) => {
  const members = []

  service.methodList.forEach((rpc, r) => {
    const paramComments = [`     * @param payload {${baseNamespace}${rpc.inputType}}`]
    let callbackParams = ''
    if (rpc.serverStreaming === true) {
      callbackParams = ', callback, context'
      paramComments.push(`     * @param callback {Function} onMessage callback`)
      paramComments.push(`     * @param context {Object} onMessage callback context`)
    }
    members.push(`
    /**
     * ${findCommentByPath([6, s, 2, r], proto.sourceCodeInfo.locationList)}
${paramComments.join('\n')}
     * @returns {${baseNamespace}${rpc.outputType}} 
     */
    ${rpc.name}: function (payload${callbackParams}) {
      qx.core.Assert.assertInstance(payload, ${baseNamespace}${rpc.inputType})
      return this._call(payload, {
        methodName: "${rpc.name}",
        service: this,
        requestStream: ${rpc.clientStreaming},
        responseStream: ${rpc.serverStreaming},
        requestType: ${baseNamespace}${rpc.inputType},
        responseType: ${baseNamespace}${rpc.outputType}
      }${callbackParams})
    }`)
  })

  const classNamespace = getClassNamespace(service, proto)

  const code = `${getClassComment(service, s, proto, 6)}
qx.Class.define('${classNamespace}', {
  extend: proto.core.BaseService,
  
  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */
  members: {
    serviceName: '${proto.pb_package}.${service.name}',
    ${members.join(',\n')}
  }
})
`
  return {
    namespace: classNamespace,
    code: code
  }
}

module.exports = genServiceClass