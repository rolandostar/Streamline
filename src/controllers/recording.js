'use strict'

function formatPayload (recordings) {
  const response = []
  for (let index = 0; index < recordings.length; index++) {
    const recording = recordings[index].get({ plain: true })
    let payload = {
      id: recording.id,
      title: recording.title,
      dirName: recording.dirName,
      labels: recording.labels,
      status: recording.status,
      createdAt: recording.createdAt,
      user: recording.UserId
    }
    if (recording.status === 'PENDING') {
      payload.scheduledFor = recording.Job.startDate
    }
    response.push(payload)
  }
  return response
}

module.exports.list = async function (request, reply) {
  const { Recording, Job } = this.sequelize.models
  const { limit, orderBy, order, readyOnly, chronological } = request.query
  const recordings = await Recording.findAll({
    order: chronological ? [[Job, 'startDate', 'DESC']] : [ [orderBy, order] ],
    limit,
    include: {
      model: Job,
      paranoid: false
    },
    where: readyOnly ? {
      UserId: request.user.id,
      status: 'READY'
    } : {
      UserId: request.user.id
    }
  })
  reply.send(formatPayload(recordings))
}
module.exports.lookup = function (request, reply) { reply.send() }
module.exports.edit = function (request, reply) { reply.send() }
module.exports.delete = function (request, reply) { reply.send() }
module.exports.search = async function (request, reply) {
  const { Recording, Job } = this.sequelize.models
  const { Op } = this.Sequelize
  const recordings = await Recording.findAll({
    where: {
      title: {
        [Op.like]: '%' + request.query.query + '%'
      }
    },
    include: Job
  })
  reply.send(formatPayload(recordings))
}

module.exports.liveUpdate = function (request, reply) {
  reply.res.setHeader('Content-Type', 'text/event-stream')
  reply.res.setHeader('Cache-Control', 'no-cache')
  reply.res.setHeader('Connection', 'keep-alive')

  // request.req.on('close', function () {
  //   reply.res.end()
  // })

  this.sse.eventEmitter.on('message', (data) => {
    reply.res.write(`event: message\ndata: ${JSON.stringify(data)}\n\n`)
  })
}
