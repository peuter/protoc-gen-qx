module.exports = {
  2: {
    qxType: 'Number',
    pbType: 'Float',
    emptyComparison: ' !== 0',
    defaultValue: 0,
    packed: true
  },
  3: {
    qxType: 'String',
    pbType: 'Int64String',
    transform: '_toString',
    emptyComparison: '.length > 0',
    defaultValue: '\'\'',
    writerTransform: `f = f.startsWith('0x') ? '' + parseInt(f, 16) : f`,
    packed: true
  },
  4: {
    qxType: 'String',
    pbType: 'Uint64String',
    transform: '_toString',
    emptyComparison: '.length > 0',
    defaultValue: '\'\'',
    writerTransform: `f = f.startsWith('0x') ? '' + parseInt(f, 16) : f`,
    packed: true
  },
  5: {
    qxType: 'Number',
    pbType: 'Int32',
    emptyComparison: ' !== 0',
    defaultValue: 0,
    packed: true
  },
  6: {
    qxType: 'Number',
    pbType: 'Double',
    emptyComparison: ' !== 0',
    defaultValue: 0,
    packed: true
  },
  8: {
    qxType: 'Boolean',
    pbType: 'Bool',
    emptyComparison: ' !== false',
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
    qxType: 'Uint8Array',
    pbType: 'Bytes',
    emptyComparison: ' !== 0'
  },
  13: {
    qxType: 'Number',
    pbType: 'Uint32',
    emptyComparison: ' !== 0',
    defaultValue: 0,
    packed: true
  }
  // 14: enum see message.js
}