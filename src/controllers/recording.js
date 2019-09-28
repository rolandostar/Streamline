'use strict'

module.exports.list = async function (request, reply) {
  const { Recording, User } = this.sequelize.models
  console.log(require('util').inspect(request.user, { depth: 0 }))
  const recordings = await Recording.findAll({
    include: {
      model: User,
      where: {
        id: request.user.id
      }
    }
  })
  reply.send(recordings)
}
module.exports.lookup = function (request, reply) { reply.send() }
module.exports.edit = function (request, reply) { reply.send() }
module.exports.delete = function (request, reply) { reply.send() }
module.exports.search = function (request, reply) { reply.send() }
