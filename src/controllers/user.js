'use strict'

const bcrypt = require('bcrypt')

module.exports.update = async function (request, reply) {
  const { User } = this.sequelize.models
  if (request.body.username) {
    if (request.body.username === request.user.username) return reply.badRequest('El nuevo username debe ser distinto al actual.')
    const desiredUser = await User.findOne({ where: { username: request.body.username }})
    if (desiredUser) return reply.badRequest('Username ya esta ocupado.')
    const currentUser = await User.findOne({ where: { username: request.user.username }})
    const tokens = await currentUser.getTokens()
    for (let index = 0; index < tokens.length; index++) {
      await tokens[index].destroy()
    }
    await currentUser.update({ username: request.body.username })
    return reply.send({ success: true })
  }
  if (request.body.password) {
    if (request.body.password.old === request.body.password.new) return reply.badRequest('La nueva contraseña debe ser distinta a la actual.')
    const user = await User.findOne({
      where: { username: request.user.username },
      attributes: ['id', 'password', 'username']
    })
    if (!bcrypt.compareSync(request.body.password.old, user.password)) {
      return reply.forbidden('Incorrect password')
    }
    const tokens = await user.getTokens()
    for (let index = 0; index < tokens.length; index++) {
      await tokens[index].destroy()
    }
    const hash = await bcrypt.hash(request.body.password.new, 12)
    await user.update({ password: hash })
    return reply.send({ success: true })
  }
}