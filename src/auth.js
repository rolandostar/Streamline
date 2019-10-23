'use strict'

const fp = require('fastify-plugin')
const bcrypt = require('bcryptjs')

async function auth (fastify, opts) {
  fastify.decorate('authenticate', (request, reply, done) => {
    request.jwtVerify((err, decoded) => {
      if (err) done(err)
      else {
        const { Token } = fastify.sequelize.models
        Token.findOne({ where: { id: decoded.jti } }).then(token => {
          if (!token) done(fastify.httpErrors.unauthorized())
          else {
            token.update({ timesUsed: token.timesUsed + 1 })
            done()
          }
        })
      }
    })
  })

  fastify.put('/renew', {
    preValidation: fastify.authenticate
  }, async (request, reply) => {
    const jwtOptions = {
      ...fastify.jwt.options.sign,
      jwtid: request.user.jti
    }
    const token = fastify.jwt.sign({ id: request.user.id, username: request.user.username }, jwtOptions)
    reply.send({ token })
  })

  fastify.delete('/logout', {
    preValidation: fastify.authenticate
  }, async (request, reply) => {
    const { Token } = fastify.sequelize.models
    const token = await Token.findOne({ where: { id: request.user.jti } })
    await token.destroy()
    reply.send({ success: true })
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
    const tokenInstance = await Token.create({ UserId: user.id, timesUsed: 0 })
    const jwtOptions = {
      ...fastify.jwt.options.sign,
      jwtid: tokenInstance.id.toString()
    }
    const token = fastify.jwt.sign({ id: user.id, username: user.username }, jwtOptions)
    reply.send({ token, username })
  })
}

module.exports = fp(auth, {
  fastify: '>=0.13.1',
  decorators: {
    fastify: ['chalk']
  }
})
