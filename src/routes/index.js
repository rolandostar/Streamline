'use strict'

module.exports = function (fastify, opts, done) {
  fastify
    .get('/', (req, reply) => {
      reply.view('dashboard.hbs', { text: 'Hello World' })
    })

    .get('/login', (req, reply) => {
      reply.view('login.hbs', {})
    })

  done()
}
