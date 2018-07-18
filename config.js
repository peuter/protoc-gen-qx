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
  // list of external dependencies that need to be required (e.g. for extensions)
  require: [],
  // skip generation and including of selected external libraries (filename needed, e.g. google-protobuf.js or grpc-web-client.js)
  skipDeps: [],
  // if true: do not add the fallback loading of external dependencies to proto.core.BaseMessage' defer method
  skipDepLoadingFallback: false,
  // do not end lines of generated code with ';' if true
  withoutSemi: false,
  // class to use for repeated properties
  repeatedClass: 'qx.data.Array',
  // static classes that provide property validation methods (like qx.util.Validate)
  // these classes are registered in the proto.util.ValidationFactory
  validatorClasses: [],
  // Field option handlers (for example see: handlers/options/qx.js)
  optionHandlers: [],
  // activate grpc client debugging mode: [true] => all requests, [false] => no debugging, ['stream'] => only streaming requests, ['single'] => only non-streaming requests
  debugApiCalls: false
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
    if (identifier && identifier !== '*') {
      // match the regexes
      Object.keys(this._config[option]).filter( key => {
        if (key.startsWith('/')) {
          var parts = key.substring(1).split('/')
          var regexp = RegExp(parts[0], parts[1])
          return regexp.test(identifier)
        }
        return false
      }).forEach(id => {
        config = Object.assign(config, this._config[option][id])
      })
      if (this._config[option].hasOwnProperty(identifier)) {
        config = Object.assign(config, this._config[option][identifier])
      }
    }
    if (!key) {
      return config
    }
    if (config.hasOwnProperty(key)) {
      return config[key]
    }
    return null
  }

  set (option, value) {
    this._config[option] = value
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