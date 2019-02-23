const fs = require('fs')
const path = require('path')

const mkdirp = require('mkdirp')
const buildJs = require('./js-build')
const logger = require('./logger')

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
        path.extname(entry) === '.json'
        ? writeJson({ entry, outfile })
        : buildJs({ config, entry, env, instrument, minify, outfile, watch })
    })
  )
}

/**
 * Pass through JSON
 */
function writeJson ({ entry, outfile }) {
  logger.log('passing through JSON file ' + entry + ' to ' + outfile)
  mkdirp.sync(path.dirname(outfile))
  fs.writeFileSync(outfile, fs.readFileSync(entry, 'utf8'))
}
