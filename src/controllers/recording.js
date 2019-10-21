'use strict'

module.exports.list = async function (request, reply) {
  const { Recording, User, Job } = this.sequelize.models
  const { limit, step, orderBy, order } = request.query
  const recordings = await Recording.findAll({
    order: [ [orderBy, order] ],
    limit,
    offset: (step - 1) * limit,
    include: [
      {
        model: Job
      }
    ]
  })
  const response = []
  for (let index = 0; index < recordings.length; index++) {
    const recording = recordings[index].get({ plain: true })
    console.log(recording)
    let payload = {
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
  reply.send(response)
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

function sseDemo (req, res) {
  let messageId = 0

  const intervalId = setInterval(() => {
    res.write(`id: ${messageId}\n`)
    res.write(`data: Test Message -- ${Date.now()}\n\n`)
    messageId += 1
  }, 1000)

  req.on('close', () => {
    clearInterval(intervalId)
  })
}

module.exports.liveUpdate = async function (request, reply) {
  console.log('sse called')
  let index = 0
  const options = {}
  reply.sse('sample data', options)
  this.event.on('progress', () => {
    console.log('new progress achieved, from handler')
    reply.sse({ event: 'test', data: index++ })
  })


  // // Send a new data every seconds for 10 seconds then close
  // const interval = setInterval(() => {
  //   console.log('sending')
  //   reply.sse({ event: 'test', data: index++ })
  //   if (!(index % 10)) {
  //     reply.sse()
  //     clearInterval(interval)
  //   }
  // }, 1000)
}
