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
      def.push({key: key, value: value})
    }
  }

module.exports = {
    setPropEntry: setPropEntry
}