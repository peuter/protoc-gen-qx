const {getClassComment, getClassNamespace} = require('./base')

const genEnumClass = (type, s, proto) => {
  const statics = []
  const classNamespace = getClassNamespace(type, proto)
  type.valueList.forEach(val => {
    statics.push(`    ${val.name}: ${val.number}`)
  })

  const code = `${getClassComment(type, s, proto, 4)}
qx.Class.define('${classNamespace}', {
  type: 'static',
  
  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */
  statics: {  
${statics.join(',\n')}
  }
})
`
  return [{
    namespace: classNamespace,
    code: code
  }]
}

module.exports = genEnumClass