const path = require('path')

const budo = require('budo')

const logger = require('./logger')
const transformJs = require('./js-transform')

module.exports = function ({ config, env, files, flyle, instrument, minify, outdir, proxy, watch }) {
  logger.log('Starting budo server...')

  const budoFiles = []
  files.map(file => {
    // Skip JSON files, which are written separately. Otherwise, they will be bundled.
    if (path.extname(file[0]) !== '.json') {
      budoFiles.push(file.join(':'))
    }
  })

  // First file is expected to be bundle JS entrypoint
  const entrypoint = files[0][0]

  const budoOpts = {
    browserify: {
      paths: [
        path.join(process.cwd(), '/node_modules'),
        path.join(__dirname, '/../node_modules')
      ],
      transform: transformJs({ config, env, instrument, minify })
    },
    cors: true,
    debug: true,
    dir: '.',
    live: {
      cache: true,
      debug: true,
      expose: false
    },
    middleware: [],
    poll: true,
    pushstate: true,
    reload: entrypoint,
    serve: entrypoint,
    watchGlob: '**/*.{js,jsx,scss,sass,css,html,json}',
    verbose: true
  }

  if (proxy) {
    const middlewareProxy = require('middleware-proxy')
    budoOpts.middleware.push(middlewareProxy('/api', proxy))
  }
  if (flyle) {
    const serveTiles = require('./flyle')
    budoOpts.middleware.push(function (req, res, next) {
      if (req.url.indexOf('/tile') === 0) {
        serveTiles(req, res)
      } else {
        next()
      }
    })
  }

  budo(budoFiles, budoOpts)
    .on('error', function (err) {
      logger.error('budo server error:')
      logger.error(err.stack)
    }).on('watch', function (event, file) {
      logger.log('budo is watching ' + file + ' on ' + event)
    }).on('reload', function () {
      logger.log('budo has reloaded')
    }).on('connect', function (ev) {
      logger.log('budo has connected')
      var wss = ev.webSocketServer
      // receiving messages from clients
      wss.on('connection', function (socket) {
        logger.log('[LiveReload] Client Connected')
        socket.on('message', function (message) {
          logger.log('[LiveReload] Message from client:', JSON.parse(message))
        })
      }).on('exit', function () {
        logger.log('budo exited')
      }).on('pending', function () {
        logger.log('budo is bundling...')
      })
        .on('update', function (buf) {
          logger.log('bundle finished --> %d bytes', buf.length)
        })
    })
}
