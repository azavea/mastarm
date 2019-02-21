const path = require('path')

const buildJs = require('./js-build')

/**
 * Takes a configuration object, array of file entries [entry, output], and other options.
 *
 * @return [Promise] array of Promises
 */

module.exports = function ({ config, env, files, instrument, minify, watch }) {
  return Promise.all(
    files.map(
      ([entry, outfile]) => {
        console.log('build entry ' + entry + ' to ' + outfile)
        buildJs({ config, entry, env, instrument, minify, outfile, watch })
    })
  )
}
