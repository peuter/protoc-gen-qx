const {setPropEntry} = require('../../utils')

module.exports = {
  name: 'qx',
  handler: function (options, context) {
    const props = context.propertyDefinition.entries
    if (options.hasOwnProperty('annotations') && options.annotations) {
        setPropEntry(props, `'@'`, `['${options.annotations.split(',').map(x => x.trim()).join('\', \'')}']`)
      }
      if (options.hasOwnProperty('date') && options.date === true) {
        setPropEntry(props, 'transform', `'_toDate'`)
        setPropEntry(props, 'check', `'Date'`)
        setPropEntry(props, 'init', `null`)
        setPropEntry(props, 'nullable', `true`)
        if (context.type.pbType === 'String') {
          // use RFC 3339 format
          context.writerTransform = `
    f = f instanceof Date ? f.toISOString() : ''${context.lineEnd}`  
        } else {
          // use timestamp
        context.writerTransform = `
    f = f instanceof Date ? '' + Math.round(f.getTime() / 1000) : ''${context.lineEnd}`
        }
      }
      if (options.hasOwnProperty('validate') && options.validate) {
        setPropEntry(props, `validate`, `${context.baseNamespace}.util.ValidatorFactory.getValidator('${options.validate}')`)
      }
  }
}