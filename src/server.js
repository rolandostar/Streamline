const path = require('path')
const config = require('config')
const fastify = require('fastify')({ logger: config.logger })
const jwtSecret = config.get('jwtSecret')
const issuer = config.get('issuer')

/* ------------------------------- Middlewares ------------------------------ */

fastify
  .register(require('./fastify-sse'))
  .register(require('fastify-cookie'))
  .register(require('fastify-sensible')) // Sensible
  .register(require('fastify-helmet')) // Optimized Helmet
  .register(require('fastify-cors')) // Cross-Origin Resource Sharing
  .register(require('fastify-chalk'))
  .register(require('fastify-jwt'), {
    secret: jwtSecret,
    sign: { issuer, expiresIn: '20m' },
    verify: { issuer }
  })
  .register(require('point-of-view'), {
    engine: {
      handlebars: require('handlebars')
    },
    templates: 'src/templates',
    options: {
      partials: {
        header: 'include/header.hbs'
      }
    }
  })
  .register(require('fastify-static'), {
    root: path.join(__dirname, 'templates', 'public'),
    decorateReply: false
  })
  .register(require('fastify-static'), {
    root: path.join(__dirname, '../storage'),
    prefix: '/storage',
    decorateReply: false
  })
/* --------------------------- Custom Middlewares --------------------------- */
  .register(require('./database'))
  .register(require('./auth'))
  .register(require('./encoder'))
  .register(require('./downloader'))
  .register(require('./scheduler'))
  .register(require('./events'))
/* --------------------------------- Routes --------------------------------- */
  .register(require('./routes/views'))
  .register(require('./routes/api'))
/* ------------------------------ Error Handler ----------------------------- */
  .setErrorHandler(function (error, request, reply) {
    request.log.warn(error)
    var statusCode = error.statusCode >= 400 ? error.statusCode : 500
    if (statusCode >= 500) error.message = 'Internal server error'
    reply
      .code(statusCode)
      .type('text/plain')
      .send(error)
  })
  .after(() => {
    let index = 0
    const interval = setInterval(() => {
      if (index >= 100) index = 0
      fastify.event.emit('message', 21, {
        source: 'encoder',
        type: 'progress',
        quality: '1080p',
        progress: index++
      })
      fastify.event.emit('message', 20, {
        source: 'downloader',
        type: 'progress',
        progress: index
      })
    }, 500)
  })

module.exports = fastify
