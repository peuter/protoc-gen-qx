#! /usr/bin/env node

/* eslint-env es6, node */
const webpack = require('webpack');
const MemoryFileSystem = require('memory-fs');
const memoryFs = new MemoryFileSystem();
const {CodeGeneratorRequest, CodeGeneratorResponse, CodeGeneratorResponseError} = require('protoc-plugin');
const fs = require('fs')
const path = require('path')
const config = require('./config')
const baseNamespace = config.get('baseNamespace')
const handlebars = require('handlebars')
const handlers = {
  serviceList: require('./handlers/service'),
  enumTypeList: require('./handlers/enum'),
  messageTypeList: require('./handlers/message')
}
const lineEnd = config.get('withoutSemi') ? '' : ';'

const webpackConfig = require('./webpack.config')
const externalResources = []
webpackConfig.forEach(config => {
  externalResources.push(`"${baseNamespace}/${config.output.filename}"`)
})
let template = handlebars.compile(fs.readFileSync(path.join(__dirname, 'templates', 'core', 'BaseService.js.hbs'), 'utf8'))
let baseServiceClass = template({
  baseNamespace: baseNamespace,
  lineEnd: lineEnd
})


require(__dirname + '/extensions_pb')

// extensions must be required before parsing
config.get('require').forEach(dep => {
  const depPath = path.normalize(path.join(process.cwd() + '/' + dep))
  require(depPath)
})

CodeGeneratorRequest()
  .then(async r => {
    const req = r.toObject()
    
    // parse parameters
    let paramParts, key, value
    const parameters = {}
    if (req.parameter) {
      req.parameter.split(',').forEach(param => {
        paramParts = param.split('=')
        key = paramParts.shift()
        value = paramParts.length > 0 ? paramParts.join('=') : true
        parameters[key] = value
      })
    }

    const protos = req.protoFileList.filter(p => req.fileToGenerateList.indexOf(p.name) !== -1)
    const skipDeps = config.get('skipDeps')
    let external = [
      "proto/google-protobuf.js",
      "proto/grpc-web-client.js"
    ].filter(entry => !skipDeps.includes(entry.split('/').pop()))

    let externalScriptsCode = '';
    if (external.length > 0) {
      externalScriptsCode = `  "script": [
        "${external.join('",\n        "')}"
      ]`
    }

    const files = [{
      name: `source/class/${baseNamespace}/core/BaseService.js`,
      content: baseServiceClass
    }, {
      name: 'Manifest.json',
      content: `{
  "info": {},
  "provides": {
    "namespace"   : "${baseNamespace}",
    "encoding"    : "utf-8",
    "class"       : "source/class",
    "resource"    : "source/resource",
    "type"        : "library"
  },
   "externalResources": {
    ${externalScriptsCode}
   }
}`
    }]

    protos.forEach(proto => {
      if (parameters.dump === true) {
        files.push({
          name: `${proto.pb_package}-${proto.name}-extended.json`,
          content: JSON.stringify(proto, null, 2)
        })
      }
      Object.keys(handlers).forEach( propName => {
        if (proto[propName]) {
          proto[propName].forEach((item, s) => {
            handlers[propName](item, s, proto).forEach(entry => {
              files.push({
                name: `source/class/${entry.namespace.split('.').join('/')}.js`,
                content: entry.code
              })
            })
          })
        }
      })
    })

    template = handlebars.compile(fs.readFileSync(path.join(__dirname, 'templates', 'core', 'BaseMessage.js.hbs'), 'utf8'))
    let baseMessageClass = template({
      baseNamespace: baseNamespace,
      lineEnd: lineEnd,
      timestampSupport: !!config.get('timestampSupport'),
      defer: config.get('skipDepLoadingFallback') === true
        ? ''
        : `,

  defer: function (statics) {
    if (!window.grpc) {
      // load dependencies
      var dynLoader = new qx.util.DynamicScriptLoader([
        qx.util.ResourceManager.getInstance().toUri(${externalResources.join('),\n      qx.util.ResourceManager.getInstance().toUri(')})
      ]);
   
      qx.bom.Lifecycle.onReady(function () {
        dynLoader.start().catch(function (err) {
          qx.log.Logger.error(statics, 'failed to load scripts', err);
        });
      }, this);
    }
  }`
    })

    files.push({
      name: `source/class/${baseNamespace}/core/BaseMessage.js`,
      content: baseMessageClass
    })

    if (config.get('validatorClasses').length) {
      template = handlebars.compile(fs.readFileSync(path.join(__dirname, 'templates', 'core', 'ValidatorFactory.js.hbs'), 'utf8'))
      let validatorFactoryClass = template({
        baseNamespace: baseNamespace,
        validatorClasses: config.get('validatorClasses').filter(clazz => clazz !== 'qx.util.Validate'),
        lineEnd: lineEnd,
      })
      files.push({
        name: `source/class/${baseNamespace}/util/ValidatorFactory.js`,
        content: validatorFactoryClass
      })
    }

    if (parameters.skipDeps !== true) {
      // create resources
      let compiler
      const promises = []
      webpackConfig.forEach(async config => {
        if (skipDeps.includes(config.output.filename)) {
          return;
        }
        config.output.path = '/build'
        compiler = webpack(config)
        compiler.outputFileSystem = memoryFs

        promises.push(new Promise((resolve, reject) => {
          compiler.run((err, stats) => {
            if (err) reject(err)
            files.push({
              name: `source/resource/${baseNamespace}/${config.output.filename}`,
              content: stats.compilation.assets[config.output.filename].source()
            })
            resolve()
          })
        }))
      })
      await Promise.all(promises)
    }
    return files
  }).then(CodeGeneratorResponse())
    .catch(CodeGeneratorResponseError())
