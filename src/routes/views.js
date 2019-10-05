'use strict'

module.exports = function (fastify, opts, done) {
  fastify
    .get('/', {
    }, (req, reply) => {
      reply.view('dashboard.hbs', {})
    })

    .get('/login', {
    }, (req, reply) => {
      reply.view('login.hbs', {})
    })

    .get('/playback', (req, reply) => {
      reply.view('player.hbs', {})
    })

    .get('/account', (req, reply) => {
      reply.view('account.hbs', {})
    })

    .get('/logout', (req, reply) => {
      reply.view('logout.hbs', {})
    })

  done()
}
