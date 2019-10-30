'use strict'

const pattern = require('../schemas/player')

module.exports = function (fastify, opts, done) {
  fastify
    .get('/', {
    }, (request, reply) => {
      reply.view('dashboard.hbs')
    })

    .get('/login', {
    }, (request, reply) => {
      reply.view('login.hbs')
    })

    .get('/playback', {
      schema: pattern.playback
    }, (request, reply) => {
      reply.view('player.hbs')
    })

    .get('/account', (request, reply) => {
      reply.view('account.hbs')
    })

    .get('/logout', (request, reply) => {
      reply.view('logout.hbs')
    })
  done()
}
