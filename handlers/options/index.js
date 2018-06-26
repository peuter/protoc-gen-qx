

class OptionHandlers {
    constructor () {
        this.__registry = {}
    }

    registerHandler (name, handler) {
        this.__registry[name] = handler
    }

    process (options, propertyDefinition, context) {
        Object.keys(options).forEach(name => {
            if (this.__registry.hasOwnProperty(name)) {
                try {
                  this.__registry[name](options[name], propertyDefinition, context)
                } catch (e) {
                    console.error('Error processing '+name+' option:', e)
                  throw e
                }
            }
        })
    }
}

const optionHandler = new OptionHandlers()

module.exports = optionHandler