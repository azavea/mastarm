const path = require('path')

const babelify = require('babelify')
const bcss = require('browserify-css')
const envify = require('envify/custom')
const markdown = require('browserify-markdown')
const commit = require('this-commit')()
const postcss = require('postcss')
const scssify = require('scssify')
const through = require('through2')
const YAML = require('yamljs')

const pkg = require('../lib/pkg')

const babelConfig = require('./babel-config')
const browsers = require('./constants').BROWSER_SUPPORT
const logger = require('./logger')

module.exports = function transform ({ config, env, instrument, minify }) {
  console.log('js transform')
  const envvars = Object.assign(
    {},
    process.env,
    {
      BUILD_TIMESTAMP: (new Date()).getTime(),
      COMMIT_SHA: commit,
      CONFIG_PATH: config.path,
      MESSAGES: JSON.stringify(config.messages),
      NODE_ENV: env,
      REPO_URL: pkg.repository && pkg.repository.url && pkg.repository.url.replace('.git', ''),
      SETTINGS: JSON.stringify(config.settings),
      STORE: JSON.stringify(config.store)
    },
    config.env
  )

  const plugins = {
    'postcss-import': {
      filter: url => {
        logger.log('processing style import from ' + url)
        // inline CSS but not SASS
        return !/\.s[ac]ss$/i.test(url)
      },
      plugins: [
        base64ify(process.cwd()) // inline all url files
      ]
    },
    'postcss-preset-env': {browsers},
    'postcss-reporter': {clearReportedMessages: true}
  }

  if (minify) {
    plugins['cssnano'] = { preset: 'default' }
  }

  return [
    svgToString,
    imagesToBase64String,
    htmlTransform,
    markdown,
    yamlTransform,
    [scssify, {
      postcss: plugins,
      autoInject: {
        prepend: true,
        verbose: true,
      },
      export: true,
      sass: {
        sourceMapEmbed: true,
        sourceMapContents: true
      }
    }],
    babelify.configure(babelConfig(env, instrument)),
    [bcss, {
      global: true,
      verbose: true
    }],
    [envify(envvars), { global: true }] // Envify needs to happen last...
  ]
}

/**
 * Transform a svg file to a module containing a JSON string
 */
function svgToString (filename) {
  if (!/\.svg$/i.test(filename)) {
    return through()
  }

  return through(function (buf, enc, next) {
    this.push('module.exports=' + JSON.stringify(buf.toString('utf8')))
    next()
  })
}

/**
 * Transform an image to a module containing a base64 string.
 */
function imagesToBase64String (filename) {
  if (!/\.png|\.jpg|\.jpeg|\.gif$/i.test(filename)) {
    return through()
  }

  return through(function (buf, enc, next) {
    this.push('module.exports=' + JSON.stringify(buf.toString('base64')))
    next()
  })
}

/**
 * Transform an html file to a module containing a JSON string
 */
function htmlTransform (filename) {
  if (!/\.html$/i.test(filename)) {
    return through()
  }

  return through(function (buf, enc, next) {
    this.push('module.exports=' + JSON.stringify(buf.toString('utf8')))
    next()
  })
}

/**
 * Transform an YAML file to a module containing a JSON string
 */
function yamlTransform (filename) {
  if (!/\.yml|\.yaml$/i.test(filename)) {
    return through()
  }

  return through(function (buf, enc, next) {
    this.push(
      'module.exports=' + JSON.stringify(YAML.parse(buf.toString('utf8')))
    )
    next()
  })
}

const base64ify = postcss.plugin('postcss-base64ify', function () {
  return function (css, result) {
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
