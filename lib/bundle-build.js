const fs = require('fs')
const path = require('path')

const exorcist = require('exorcist')
const mkdirp = require('mkdirp')

const browserify = require('./browserify')
const logger = require('./logger')

/**
 *
 * @return Promise
 */

module.exports = function buildBundle ({
  config,
  entry,
  env,
  instrument,
  minify,
  outfile,
  watch
}) {
  const pipeline = minify
    ? browserify.minify({ config, entry, env, instrument, minify })
    : browserify({ config, entry, env, instrument, minify })

  const bundle = () =>
    new Promise((resolve, reject) => {
      if (outfile) {
        mkdirp.sync(path.dirname(outfile))
        pipeline
          .bundle()
          .pipe(exorcist(`${outfile}.map`))
          .pipe(fs.createWriteStream(outfile))
          .on('error', reject)
          .on('finish', function () {
            logger.log('Finished bundling ' + entry)
            resolve()
          })
      } else {
        pipeline.bundle((err, buf) => {
          if (err) reject(err)
          else resolve(buf)
        })
      }
    })

  if (watch) {
    pipeline.plugin(require('watchify'), {
      ignoreWatch: true,
      poll: true
    })
    pipeline.plugin(require('errorify'))
    pipeline.on('update', bundle)
    pipeline.on('log', logger.log)
  }

  return bundle()
}
