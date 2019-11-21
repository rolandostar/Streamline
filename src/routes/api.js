'use strict'

module.exports = function (fastify, opts, done) {
  fastify.get('/health-check', (request, reply) => {
    reply.send({ status: 'OK' })
  })
  fastify.register(require('./recording'), { prefix: 'recording' })
  fastify.register(require('./job'), { prefix: 'job' })
  fastify.register(require('./user'), { prefix: 'user' })
  // fastify.register(require('./recording'), { prefix: 'recording' })

  // fastify.post('/live-push', function (request, reply) {
  //   this.sse.livePush(request.body)
  //   reply.send()
  // })
  done()
}
