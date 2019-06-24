const fs = require('fs')

const glob = require('glob')
const unique = require('lodash.uniq')

const { stat } = require('./fs-promise')
const logger = require('./logger')

exports.assertEntriesExist = function (entries) {
  if (entries.length === 0) {
    throw new Error(
      'No file(s) found! Did you spell the filename(s) correctly?'
    )
  }
  entries.forEach(entry => {
    if (!fs.existsSync(entry[0])) {
      throw new Error(`Entry: ${entry[0]} does not exist`)
    }
  })
}

/**
 * Calculate a list of globbed files based on a list of files, folders or glob patterns.
 */
exports.cliFileEntriesToArray = function (files, failOnMissingFile) {
  const foundFiles = []
  const missingFiles = []

  /**
   * Add the file to the foundFiles or missingFiles arrays based on their existance.
   */
  function classifyFile (file) {
    return stat(file).then(({ err, stats }) => {
      if (err) {
        if (err.code === 'ENOENT') {
          missingFiles.push(file)
        } else {
          throw err
        }
      } else {
        foundFiles.push(file)
      }
    })
  }

  /**
   * Sleep for a second
   */
  const DELAY_INVALIDATION_MS = 1000
  exports.delayOneSecond = function () {
    return (result) =>
      new Promise(resolve => setTimeout(() => resolve(result), DELAY_INVALIDATION_MS))
  }

  /**
   * Use the `glob` function on a file, but return a promise
   */
  function globPromise (file) {
    return new Promise((resolve, reject) => {
      glob(file, (err, files) => {
        if (err) {
          reject(err)
        } else {
          resolve(files)
        }
      })
    })
  }

  /**
   * Glob a path.
   * If the path is a file, return the path
   * If the path is a directory, return the promisified glob of the directory
   * Throw an error if the path does no exist
   */
  function globFile (file) {
    return stat(file).then(({ err, stats }) => {
      if (err) throw err
      if (stats.isDirectory()) {
        // TODO what if file is already slash-terminated?
        switch (file) {
          case './':
            return globPromise('./*.js')
          case 'bin':
            return globPromise('bin/*')
          default:
            return globPromise(`${file}/**/*.js`)
        }
      } else {
        return Promise.resolve(file)
      }
    })
  }

  return Promise.all(files.map(file => classifyFile(file)))
    .then(() => {
      if (failOnMissingFile && missingFiles.length > 0) {
        logger.log('some files were not found:')
        missingFiles.forEach(f => logger.log(` - ${f}`))
        process.exit(1)
      }
      return Promise.all(foundFiles.map(file => globFile(file)))
    })
    .then(globbedFiles => {
      return Promise.resolve([].concat(...globbedFiles))
    })
}

exports.configureEnvironment = ({ config, env }) => {
  Object.assign(
    process.env,
    {
      CONFIG_PATH: config.path,
      MESSAGES: JSON.stringify(config.messages),
      NODE_ENV: env,
      SETTINGS: JSON.stringify(config.settings),
      STORE: JSON.stringify(config.store)
    },
    config.env
  )
}

exports.makeGetFn = targets => {
  return item => {
    const target = targets.find(t => t[item] !== undefined)
    if (target) return target[item]
  }
}

/**
 * Parse entry pairs in the format of `input:output` passed either through the CLI or settings file. If it is not a pair then it uses the `outdir` setting to determine the pairing.
 *
 * @return {Array[String, String]} entries
 */
exports.parseEntries = function (entries, outdir) {
  return unique(entries).map(entry => entry.split(':'))
}

const COMMAND_LENGTH = 2
/**
 * A lot of subcommands utilize exact argument lengths. Pop mastarm to handle it.
 */
exports.popMastarmFromArgv = function () {
  process.argv = process.argv.slice(0, 1).concat(process.argv.slice(COMMAND_LENGTH))
}
