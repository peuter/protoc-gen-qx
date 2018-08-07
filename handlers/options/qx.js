const {setPropEntry,addAnnotations} = require('../../utils')

module.exports = {
  name: 'qx',
  handler: function (options, propertyDefinition, context) {
    const props = propertyDefinition.entries
    if (options.hasOwnProperty('annotations') && options.annotations) {
      addAnnotations(props, options.annotations.split(',').map(x => x.trim()))
    }
    if (options.hasOwnProperty('type')) {
      switch (options.type.toLowerCase()) {
        case 'date':
          setPropEntry(props, 'transform', `'_toDate'`)
          setPropEntry(props, 'check', `'Date'`)
          setPropEntry(props, 'init', `null`)
          setPropEntry(props, 'nullable', `true`)
          if (propertyDefinition.type.pbType === 'String') {
            // use RFC 3339 format
            propertyDefinition.writerTransform = `
      f = f instanceof Date ? f.toISOString() : ''${context.lineEnd}`
          } else {
            // use timestamp
            propertyDefinition.writerTransform = `
      f = f instanceof Date ? '' + Math.round(f.getTime() / 1000) : ''${context.lineEnd}`
          }
          break

        case 'json':
          setPropEntry(props, 'transform', `'_fromJson'`)
          setPropEntry(props, 'check', `'Object'`)
          setPropEntry(props, 'init', `null`)
          setPropEntry(props, 'nullable', `true`)
          propertyDefinition.writerTransform = `
      f = qx.lang.Json.stringify(f)${context.lineEnd}`
          break
      }
    }
    if (options.hasOwnProperty('validate') && options.validate) {
      setPropEntry(props, `validate`, `${context.baseNamespace}.util.ValidatorFactory.getValidator('${options.validate}')`)
    }
  }
}