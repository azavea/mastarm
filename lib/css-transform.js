const fs = require('fs')
const path = require('path')

const cssnano = require('cssnano')
const chokidar = require('chokidar')
const mimeType = require('mime')
const mkdirp = require('mkdirp')
const postcss = require('postcss')
const postcssImport = require('postcss-import')
const postcssPresetEnv = require('postcss-preset-env')
const postcssReporter = require('postcss-reporter')
const postcssSafeParser = require('postcss-safe-parser')
const scssify = require('scssify')

const browsers = require('./constants').BROWSER_SUPPORT
const logger = require('./logger')

module.exports = function ({ config, entry, minify, outfile, watch }) {
  const configImport = config.stylePath
    ? `@import url(${config.stylePath});`
    : ''
  let watcher
  const plugins = [
    postcssImport({
      filter: url => {
        if (watch) {
          watcher.add(url) // watch imported styles
        }
        return true
      },
      plugins: [
        base64ify(process.cwd()) // inline all url files
      ]
    }),
    base64ify(process.cwd()),
    postcssPresetEnv({browsers})
  ]

  if (minify) {
    plugins.push(cssnano({ preset: 'default' }))
  }

  plugins.push(postcssReporter({ clearReportedMessages: true }))

  const transform = () =>
    console.log('transform ' + entry + ' to ' + outfile)
    /*
    scssify(entry, {
      autoInject: false,
      export: true,
      sass: {
        importer: function(url, prev, done) {
          console.log('importer')
          console.log(done)
          done({file: outfile})
        },
        sourceMapEmbed: true,
        sourceMapContents: true
      },
      postcss: {
        plugins,
        from: undefined,
        map: { inline: false },
        parser: postcssSafeParser,
        to: outfile
      }
    }, function(result) {
      console.log('first done with result')
      console.log(result)
    })
    */

    postcss(plugins)
      .process(`${configImport}${fs.readFileSync(entry, 'utf8')}`, {
        from: undefined,
        map: { inline: false },
        parser: postcssSafeParser,
        to: outfile
      })
      .then(function (results) {
        if (outfile) {
          mkdirp.sync(path.dirname(outfile))
          fs.writeFileSync(outfile, results.css)
          if (results.map) {
            fs.writeFileSync(`${outfile}.map`, results.map)
          }
          if (watch) {
            logger.log(`updated ${outfile}`)
          }
        }
        return results
      })

  if (watch) {
    watcher = chokidar.watch(entry)
    watcher
      .on('add', transform)
      .on('change', transform)
      .on('unlink', transform)
  }

  return transform()
}

const base64ify = postcss.plugin('postcss-base64ify', function () {
  return function (css, result) {
    console.log('base64ify')
    css.replaceValues(/url\((\s*)(['"]?)(.+?)\2(\s*)\)/g, function (string) {
      const filename = getUrl(string)
        .split('?')[0]
        .split('#')[0]
      let file
      if (
        filename.indexOf('data') === 0 ||
        filename.length === 0 ||
        filename.indexOf('http') === 0
      ) {
        return string
      } else if (filename[0] === '/') {
        file = path.join(process.cwd(), filename)
      } else {
        const source = css.source.input.file
        const dir = path.dirname(source)
        file = path.resolve(dir, filename)
      }
      if (!fs.existsSync(file)) {
        throw new Error(`File ${file} does not exist`)
      }
      const buffer = fs.readFileSync(file)
      return (
        'url("data:' +
        mimeType.getType(filename) +
        ';base64,' +
        buffer.toString('base64') +
        '")'
      )
    })
  }
})

const URL_POSITION = 3

/**
 * Extract the contents of a css url
 *
 * @param  {string} value raw css
 * @return {string}       the contents of the url
 */
function getUrl (value) {
  console.log('getUrl')
  const reg = /url\((\s*)(['"]?)(.+?)\2(\s*)\)/g
  const match = reg.exec(value)
  const url = match[URL_POSITION]
  return url
}
