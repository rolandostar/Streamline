'use strict'

const fp = require('fastify-plugin')

async function auth (fastify, opts) {
  // ruta registro de usuarios
  // ruta de login
  // ruta de logout
  // funcion de lectura de token con permiso
  fastify.post('/login', (request, reply) => {
    fastify.debug(request.body)
    reply.send({ msg: 'Hello World' })
  })
}

module.exports = fp(auth, {
  fastify: '>=0.13.1',
  decorators: {
    fastify: ['chalk']
  }
})
