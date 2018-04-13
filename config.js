const path = require('path')
const fs = require('fs')
const merge = require('lodash.merge')

const defaultConfig = {
  baseNamespace: 'proto',
  messageType: {
    '*': {
      // relative to baseNamespace (starting with .)
      extend: '.core.BaseMessage',
      include: [],
      implement: []
    }
  },
  service: {
    '*': {
      // relative to baseNamespace (starting with .)
      extend: '.core.BaseService',
      include: [],
      implement: []
    }
  },
  // list of external dependencies that need to be requires (e.g. for extensions)
  require: []
}

class Config {
  constructor () {
    this._config = defaultConfig
    this.loadConfigs()
  }

  /**
   * Load configs from filesystem
   */
  async loadConfigs () {
    const localConfigFile = path.join(process.cwd(), 'protoc-gen-qx.config.js')
    if (fs.existsSync(localConfigFile)) {
      const localConfig = require(localConfigFile)
      merge(this._config, localConfig)
    }
    // console.error(JSON.stringify(this._config, null, 2))
  }

  get (option, identifier, key) {
    if (!this._config.hasOwnProperty(option)) {
      return null
    }
    if (!identifier) {
      return this._config[option]
    }
    let config = this._config[option]['*'] ? Object.assign({}, this._config[option]['*']) : {}
    if (identifier && identifier !== '*' && this._config[option].hasOwnProperty(identifier)) {
      config = Object.assign(config, this._config[option][identifier])
    }
    if (!key) {
      return config
    }
    if (config.hasOwnProperty(key)) {
      return config[key]
    }
    return null
  }

  getExtend (option, identifier) {
    let extend = this.get(option, identifier, 'extend')
    if (extend) {
      if (extend.startsWith('.')) {
        // relative
        return this.get('baseNamespace') + extend
      } else {
        return extend
      }
    }
    return null
  }

  getIncludes (option, identifier) {
    return this.__getNamespacedList(option, identifier, 'include')
  }

  getImplements (option, identifier) {
    return this.__getNamespacedList(option, identifier, 'implement')
  }

  __getNamespacedList (option, identifier, key) {
    let entries = this.get(option, identifier, key)
    // console.error(option, identifier, key, entries)
    if (entries) {
      if (!Array.isArray(entries)) {
        entries = [entries]
      }
      entries.forEach((inc, index) => {
        if (inc.startsWith('.')) {
          // relative
          entries[index] = this.get('baseNamespace') + inc
        }
      })
    } else {
      entries = []
    }
    return entries
  }
}

const config = new Config()
module.exports = config