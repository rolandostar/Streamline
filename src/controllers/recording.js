'use strict'

module.exports.list = async function (request, reply) {
  const { Recording, User } = this.sequelize.models
  const { limit, step, orderBy, order } = request.query
  const recordings = await Recording.findAll({
    order: [ [orderBy, order] ],
    limit,
    offset: (step - 1) * limit,
    include: {
      model: User,
      where: {
        username: request.user.username
      }
    }
  })
  reply.send(recordings)
}
module.exports.lookup = function (request, reply) { reply.send() }
module.exports.edit = function (request, reply) { reply.send() }
module.exports.delete = function (request, reply) { reply.send() }
module.exports.search = async function (request, reply) {
  const { Recording } = this.sequelize.models
  const { Op } = this.Sequelize
  const recordings = await Recording.findAll({
    where: {
      title: {
        [Op.like]: '%' + request.query.query + '%'
      }
    }
  })
  reply.send(recordings)
}
