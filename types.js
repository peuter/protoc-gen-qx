module.exports = {
  2: {
    qxType: 'Double',
    pbType: 'Float',
    emptyComparison: ' != null',
    defaultValue: 0
  },
  4: {
    qxType: 'Number',
    pbType: 'Uint64',
    emptyComparison: ' !== 0',
    defaultValue: 0
  },
  5: {
    qxType: 'Integer',
    pbType: 'Int32',
    emptyComparison: ' != null',
    defaultValue: 0
  },
  8: {
    qxType: 'Boolean',
    pbType: 'Bool',
    emptyComparison: ' != null',
    defaultValue: false
  },
  9: {
    qxType: 'String',
    pbType: 'String',
    emptyComparison: '.length > 0',
    defaultValue: '\'\''
  },
  // 11: reference see message.js
  12: {
    qxType: 'Number',
    pbType: 'Bytes',
    emptyComparison: ' !== 0'
  },
  13: {
    qxType: 'Number',
    pbType: 'Uint32',
    emptyComparison: ' !== 0',
    defaultValue: 0
  }
  // 14: enum see message.js
}