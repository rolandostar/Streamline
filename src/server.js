const path = require('path')
const config = require('config')
const fastify = require('fastify')({ logger: config.logger })
const jwtSecret = config.get('jwtSecret')
/* ------------------------------- Middlewares ------------------------------ */

fastify
  .register(require('fastify-cookie'))
  .register(require('fastify-sensible')) // Sensible
  .register(require('fastify-helmet')) // Optimized Helmet
  .register(require('fastify-cors')) // Cross-Origin Resource Sharing
  .register(require('fastify-chalk'))
  .register(require('fastify-jwt'), { secret: jwtSecret })
  .register(require('point-of-view'), {
    engine: {
      handlebars: require('handlebars')
    },
    templates: 'src/templates',
    options: {
      partials: {
        header: 'include/header.hbs',
        nav: 'include/nav.hbs'
      }
    }
  })
  .register(require('fastify-static'), {
    root: path.join(__dirname, 'templates', 'public'),
    decorateReply: false
  })
/* --------------------------- Custom Middlewares --------------------------- */
  .register(require('./database'))
  .register(require('./auth'))
  .register(require('./downloader'))
  .register(require('./scheduler'))
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

module.exports = fastify
