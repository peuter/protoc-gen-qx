function setPropEntry(def, key, value) {
  let exists = false
  def.some(entry => {
    if (entry.key === key) {
      exists = true
      entry.value = value
      return true
    }
  })
  if (!exists) {
    def.push({ key: key, value: value })
  }
}

function addAnnotations(props, values) {
  const propEntry = props.find(entry => entry.key === `'@'`)
  if (propEntry) {
    if (propEntry.value.length === 0) {
      propEntry.value = `['${values.join('\', \'')}']`
    } else {
      values.forEach(value => {
        if (!propEntry.value.includes(value)) {
          propEntry.value = propEntry.value.substring(0, propEntry.value.length - 1) + ',\'' + value + '\']'
        }
      })
    }
  } else {
    setPropEntry(props, `'@'`, `['${values.join('\', \'')}']`)
  }
}

module.exports = {
    setPropEntry: setPropEntry,
    addAnnotations: addAnnotations
}