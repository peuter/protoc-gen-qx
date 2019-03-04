

class OptionHandlers {
    constructor () {
        this.__order = [];
        this.__registry = {}
    }

    registerHandler (name, handler) {
        this.__order.push(name);
        this.__registry[name] = handler
    }

    process (options, propertyDefinition, context) {
        this.__order.forEach(name => {
            if (options.hasOwnProperty(name)) {
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