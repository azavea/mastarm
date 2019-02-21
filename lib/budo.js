const path = require('path')

const budo = require('budo')

const logger = require('./logger')
const transformJs = require('./js-transform')

module.exports = function ({ config, env, files, flyle, instrument, proxy, minify }) {

  const dir = path.resolve(process.cwd(), './assets')
  console.log('serving ' + dir)

  const dirs = [
    'assets/',
    'node_modules'
  ]

  const budoOpts = {
    browserify: {
      debug: true,
      dir: ['assets/'],
      live: true,
      transform: transformJs({ config, env, instrument, minify })
    },
    cors: true,
    middleware: [],
    pushstate: true,
    verbose: true
  }
  if (proxy) {
    console.log('proxy')
    const middlewareProxy = require('middleware-proxy')
    budoOpts.middleware.push(middlewareProxy('/api', proxy))
  }
  if (flyle) {
    console.log('flyle')
    const serveTiles = require('./flyle')
    budoOpts.middleware.push(function (req, res, next) {
      if (req.url.indexOf('/tile') === 0) {
        serveTiles(req, res)
      } else {
        next()
      }
    })
  }

  files.map(file => {
    console.log(file[0] + ':' + file[1])
    //budoFiles.push(file[1])
  })

  console.log(budoOpts)

  budo.cli(['.'], budoOpts).on('error', function (err) {
    logger.error('budo server error')
    logger.error(budoOpts)
    logger.error(err.stack)
  }).on('watch', function(event, file) {
    logger.log('budo watch...')
    logger.log(event)
    logger.log(file)
  })
}
