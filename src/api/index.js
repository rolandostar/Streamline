module.exports = function (fastify, opts, done) {
  fastify.log.info('ROUTES\t[%s]', fastify.chalk.green('REGISTERED'))
  //fastify.get('/user', handler_v1)
  fastify.get('/test', () => {})
  done()
}

// module.exports = function (fastify, _opts, next) {
//   // fastify.setErrorHandler(function (error, request, reply) {
//   //   request.log.error(error)
//   //   if (error.name === 'SequelizeValidationError') {
//   //     let message = 'Database error'
//   //     if (['development', 'testing'].includes(config.get('environment'))) {
//   //       message = error
//   //     }
//   //     return reply.internalServerError(message)
//   //   }
//   //   if (error.validation) {
//   //     const validationErrors = []
//   //     error.validation.forEach(validationErrorItem => {
//   //       let key = validationErrorItem.dataPath.replace('.', '')
//   //       validationErrors.push({ [key]: validationErrorItem.message })
//   //     })
//   //     return reply.status(400).send({ validation_errors: validationErrors })
//   //   }
//   //   var statusCode = error.statusCode >= 400 ? error.statusCode : 500
//   //   if (statusCode >= 500) error.message = 'Internal server error'
//   //   reply.code(statusCode).type('text/plain').send(error)
//   // })

//   // fastify.register(require('../auth'))
//   // fastify.register(require('./invitation'), { prefix: '/invitation' })
//   // fastify.register(require('./user'), { prefix: '/user' })
//   // fastify.register(require('./permission'), { prefix: '/permission' })
//   // fastify.register(require('./role'), { prefix: '/role' })
//   // fastify.register(require('./devices/scanti'), { prefix: '/devices/scanti' })
//   //fastify.setNotFoundHandler((_req, reply) => reply.notFound())
//   next()
// }
