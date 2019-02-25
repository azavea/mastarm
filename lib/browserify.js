const path = require('path')

const browserify = require('browserify')
const uglifyify = require('uglifyify')

const transform = require('./js-transform')

module.exports = browserifyIt

/**
 * Bundle some js together with browserify
 */
function browserifyIt ({ config, entry, env, instrument, minify }) {
  return browserify(entry, {
    basedir: process.cwd(),
    cache: {},
    debug: true,
    fullPaths: env === 'development',
    packageCache: {},
    paths: [
      path.join(__dirname, '/../node_modules'),
      path.join(process.cwd(), '/node_modules')
    ],
    transform: transform({ config, env, instrument, minify })
  })
}

module.exports.minify = function (opts) {
  const pipeline = browserifyIt(opts)
  pipeline.transform(uglifyify, { global: true, mangle: false })
  return pipeline
}
