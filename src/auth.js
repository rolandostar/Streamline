'use strict'

const fp = require('fastify-plugin')
const bcrypt = require('bcrypt')

async function auth (fastify, opts) {
  // ruta registro de usuarios
  // funcion de lectura de token con permiso-*

  // TODO To refresh the token your API needs a new endpoint that receives a valid, not expired JWT and returns the same signed JWT with the new expiration field. Then the web application will store the token somewhere.

  fastify.decorate('authenticate', (request, reply, done) => {
    request.jwtVerify({ ignoreExpiration: true }, (err, decoded) => {
      if (err) done(err)
      else done()
    })
  })

  fastify.post('/login', {
    schema: {
      body: {
        type: 'object',
        properties: {
          username: { type: 'string' },
          password: { type: 'string' }
        },
        required: ['username', 'password']
      }
    }
  }, async (request, reply) => {
    const { User, Token } = fastify.sequelize.models
    const { username, password } = request.body
    const user = await User.findOne({
      where: { username },
      attributes: ['id', 'password', 'username']
    })
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return reply.unauthorized('Username or password incorrect')
    }
    const tokenInstance = await Token.create({ UserId: user.id, count: 0 })
    const jwtPayload = { id: user.id, username: user.username }
    const jwtOptions = { expiresIn: '50m', jwtid: tokenInstance.id.toString() }
    const token = fastify.jwt.sign(jwtPayload, jwtOptions)
    jwtPayload.token = token
    let d = new Date()
    d.setMinutes(d.getMinutes() + 20)
    jwtPayload.exp = d.getTime()
    reply.send(jwtPayload)
  })
}

module.exports = fp(auth, {
  fastify: '>=0.13.1',
  decorators: {
    fastify: ['chalk']
  }
})
