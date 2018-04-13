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
const handlers = {
  serviceList: require('./handlers/service'),
  enumTypeList: require('./handlers/enum'),
  messageTypeList: require('./handlers/message')
}

const webpackConfig = require('./webpack.config')
const externalResources = []
webpackConfig.forEach(config => {
  externalResources.push(`"${baseNamespace}/${config.output.filename}"`)
})

let baseServiceClass = fs.readFileSync(path.resolve(__dirname, './BaseService.js'), 'utf8')
baseServiceClass = baseServiceClass.replace(/qx.Class.define\('proto.core/, `qx.Class.define('${baseNamespace}.core`)

let baseMessageClass = fs.readFileSync(path.resolve(__dirname, './BaseMessage.js'), 'utf8')
baseMessageClass = baseMessageClass.replace(/qx.Class.define\('proto.core/, `qx.Class.define('${baseNamespace}.core`)
baseMessageClass = baseMessageClass.replace(/@asset\(proto/, `@asset(${baseNamespace}`)

// load external resources in defer
baseMessageClass = baseMessageClass.replace(/\/\/###DEFER###/g, `,

  defer: function (statics) {
    var dynLoader = new qx.util.DynamicScriptLoader([
      qx.util.ResourceManager.getInstance().toUri(${externalResources.join('),\n      qx.util.ResourceManager.getInstance().toUri(')})
    ]);
 
    qx.bom.Lifecycle.onReady(function () {
      dynLoader.start().catch(function (err) {
        qx.log.Logger.error(statics, 'failed to load scripts', err);
      });
    }, this);
  }
`)

// extensions must be required before parsing
config.get('require').forEach(require)

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

    const files = [{
      name: `source/class/${baseNamespace}/core/BaseService.js`,
      content: baseServiceClass
    }, {
      name: `source/class/${baseNamespace}/core/BaseMessage.js`,
      content: baseMessageClass
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
            const {namespace, code} = handlers[propName](item, s, proto)
            files.push({
              name: `source/class/${namespace.split('.').join('/')}.js`,
              content: code
            })
          })
        }
      })
    })

    if (parameters.skipDeps !== true) {
      // create resources
      let compiler
      const promises = []
      webpackConfig.forEach(async config => {
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
