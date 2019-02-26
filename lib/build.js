const fs = require('fs')
const path = require('path')

const mkdirp = require('mkdirp')

const buildBundle = require('./bundle-build')
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
        return path.extname(entry) === '.json'
          ? writeJson({ entry, outfile })
          : buildBundle({ config, entry, env, instrument, minify, outfile, watch })
      })
  )
}

/**
 * Pass through JSON
 */
function writeJson ({ entry, outfile }) {
  logger.log('writing JSON file ' + entry + ' to ' + outfile)
  mkdirp.sync(path.dirname(outfile))
  fs.writeFileSync(outfile, fs.readFileSync(entry, 'utf8'))
  // touch an empty .map file
  mkdirp.sync(path.dirname(outfile + '.map'))
  fs.writeFileSync(outfile + '.map', '')
}
