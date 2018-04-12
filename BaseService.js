qx.Class.define('proto.core.BaseService', {
  extend: qx.core.Object,
  type: 'abstract',

  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */
  construct: function (url, metadata) {
    this.base(arguments);
    this.setUrl(url);

    if (metadata) {
      this.setMetadata(metadata);
    }
  },

  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */
  properties: {
    url: {
      check: 'String',
      init: 'null'
    },

    metadata: {
      check: 'Object',
      nullable: true,
      apply: '_applyMetadata'
    }
  },

  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */
  members: {
    __metadata: null,

    _applyMetadata: function (value) {
      if (value) {
        this.__metadata = new grpc.Metadata({
          username: 'admin',
          password: 'secret'
        })
      } else {
        this.__metadata = null;
      }
    },

    _call: function (payload, serviceDefinition) {
      var args = qx.lang.Array.fromArguments(arguments, 2);
      var config = {
        request: payload,
        host: this.getUrl(),
        metadata: this.__metadata
        // debug: qx.core.Environment.get('qx.debug')
      };
      return new qx.Promise(function (resolve, reject) {
        if (serviceDefinition.responseStream === true) {
          // streaming response
          var context = null;
          var callback;
          if (typeof args[args.length - 1] === 'object') {
            context = args.pop();
          }
          if (typeof args[args.length - 1] === 'function') {
            callback = args.pop();
          }
          else {
            throw Error('no callback defined');
          }
          if (config.request === callback) {
            config.request = new proto.vtapi.Empty();
          }
          grpc.invoke(serviceDefinition, Object.assign(config, {
            onMessage: callback.bind(context),
            onEnd: function (code, message, trailers) {
              if (code !== grpc.Code.OK) {
                reject(new Error(message));
              }
              else {
                resolve(message);
              }
            }
          }));
        }
        else {
          grpc.unary(serviceDefinition, Object.assign(config, {
            onEnd: function (res) {
              if (res.status !== grpc.Code.OK) {
                reject(new Error(res.statusMessage));
              }
              else {
                resolve(res.message);
              }
            }
          }));
        }
      }, this);
    }
  }
})