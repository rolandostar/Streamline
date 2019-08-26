'use strict'

const fp = require('fastify-plugin')

module.exports = fp(async function (fastify, opts) {
  const { models: { User, Token } } = fastify.Sequelize

  fastify
    .decorateReply('tokenExp', undefined)
    .addHook('preSerialization', function (request, reply, payload, next) {
      if (Array.isArray(payload)) next(new Error('send() admits JSON only'))
      else next(null, payload)
    })
    .addHook('onSend', function (request, reply, payload, next) {
      let err = null
      payload = payload || '{}'
      try {
        let modified = JSON.parse(payload)
        if (reply.tokenExp) modified.exp = reply.tokenExp
        next(err, JSON.stringify(modified))
      } catch (err) {
        fastify.log.error('onSend() Invalid Payload')
      }
    })
    .register(require('fastify-jwt'), {
      secret: require('config').get('jwtSecret')
    })
    .decorate('auth', function (request, reply, done) {
      request.jwtVerify({ ignoreExpiration: true }, function (err, decoded) {
        if (err) return reply.unauthorized(err.message)

        const bearerToken = request.headers.authorization
        const token = bearerToken.replace('Bearer ', '')

        Token.findOne({ where: {
          token
        } }).then(token => {
          if (!token) {
            return reply.unauthorized('Token incorrect.')
          }

          var now = new Date()
          var renovatedAt = new Date(token.renovatedAt)
          renovatedAt.setMinutes(renovatedAt.getMinutes() + 20)
          reply.tokenExp = renovatedAt.getTime()

          if (now.getTime() >= renovatedAt.getTime() && token.unlimited === false) {
            token.destroy()
            return reply.unauthorized('Token is expired.')
          }

          token.update({ count: token.count + 1 })

          const { permissions: requiredPermissions = [] } = reply.context.config
          const { permissions: userPermissions = [] } = decoded

          const auth = requiredPermissions.some(requiredPermission =>
            userPermissions.some(userPermission => requiredPermission === userPermission)
          )

          if (!auth) {
            done(fastify.httpErrors.unauthorized('Insufficient permissions'))
          } else {
            done()
          }
        })
      })
    })
    .post('/login', (request, reply) => {
      const {
        email = '',
        password = ''
      } = request.body

      User.findOne({
        where: { email },
        attributes: ['id', 'username', 'password', 'disabled']
      }).then(user => {
        if (!user || !require('bcrypt').compareSync(password, user.password)) {
          return reply.unauthorized('Email or password incorrect')
        } else if (user.disabled === true) {
          return reply.unauthorized('User is disabled')
        }

        fastify.Sequelize.query('SELECT DISTINCT "Permissions".code from "Permissions","RolePermissions","UserRoles","Roles","Users" WHERE "Permissions".id = "RolePermissions"."PermissionId" AND "RolePermissions"."RoleId" = "Roles".id AND "Roles".id = "UserRoles"."RoleId" AND "UserRoles"."UserId"  = "Users".id AND "Users".id = ' + user.id, { type: fastify.Sequelize.schema.QueryTypes.SELECT })
          .then((permissions) => {
            let payload = {
              id: user.id,
              username: user.username,
              permissions: []
            }

            permissions.forEach(permission => {
              payload.permissions.push(permission.code)
            })

            const token = fastify.jwt.sign(payload, { expiresIn: '20m' })
            payload = fastify.jwt.decode(token)
            payload.token = token
            Token.create({
              UserId: user.id,
              token,
              count: 1
            })
            delete payload.permissions
            reply.send(payload)
          })
      })
    })
})
