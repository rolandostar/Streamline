'use strict'

module.exports = function (fastify, opts, done) {
  fastify.get('/health-check', (request, reply) => {
    reply.send({ status: 'OK' })
  })
  fastify.register(require('./recording'), { prefix: 'recording' })
  fastify.register(require('./task'), { prefix: 'task' })
  fastify.register(require('./user'), { prefix: 'user' })
  // fastify.register(require('./recording'), { prefix: 'recording' })
  done()
}
