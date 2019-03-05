const fs = require('fs')
const path = require('path')

const mkdirp = require('mkdirp')

const buildBundle = require('./bundle-build')
const logger = require('./logger')

// Copy without bundling files with these extensions
const copyFileExtensions = ['.json', '.png', '.svg', '.jpg', '.jpeg', '.bmp', '.tiff', '.webp']

/**
 * Takes a configuration object, array of file entries [entry, output], and other options.
 *
 * @return [Promise] array of Promises
 */
module.exports = function ({ config, env, files, instrument, minify, watch }) {
  return Promise.all(
    files.map(
      ([entry, outfile]) => {
        return copyFileExtensions.indexOf(path.extname(entry)) >= 0
          ? copyFile({ entry, outfile })
          : buildBundle({ config, entry, env, instrument, minify, outfile, watch })
      })
  )
}

/**
 * Pass through JSON and image files
 */
function copyFile ({ entry, outfile }) {
  logger.log('writing file ' + entry + ' as-is to ' + outfile)
  mkdirp.sync(path.dirname(outfile))
  fs.writeFileSync(outfile, fs.readFileSync(entry, 'utf8'))
  // touch an empty .map file
  mkdirp.sync(path.dirname(outfile + '.map'))
  fs.writeFileSync(outfile + '.map', '')
}
