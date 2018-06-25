

class OptionHandlers {
    constructor () {
        this.__registry = {}
    }

    registerHandler (name, handler) {
        this.__registry[name] = handler
    }

    process (options, context) {
        Object.keys(options).forEach(name => {
            if (this.__registry.hasOwnProperty(name)) {
                this.__registry[name](options[name], context)
            }
        })
    }
}

const optionHandler = new OptionHandlers()

module.exports = optionHandler