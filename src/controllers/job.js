'use strict'

module.exports.list = function (request, reply) { reply.send() }
module.exports.lookup = function (request, reply) { reply.send() }
module.exports.edit = function (request, reply) { reply.send() }
module.exports.delete = function (request, reply) { reply.send() }
module.exports.create = async function (request, reply) {
  const { downloadVideo } = this
  const { Recording, Job, User } = this.sequelize.models
  const { title, url, dateStart, duration = 'None' } = request.body
  if (duration === '00:00:00') return reply.badRequest('Duración debe ser de al menos 1 segundo.')
  const startDate = new Date(dateStart)
  const nowDate = new Date()
  // if (endDate.getTime() <= startDate.getTime()) return reply.badRequest('Tiempo Fin debe ser mayor a Tiempo de Inicio')
  // if (nowDate.getTime() >= endDate.getTime()) return reply.badRequest('Tiempo Fin debe ser mayor al Tiempo Actual')
  const user = await User.findOne({ where: { username: request.user.username } })
  const recording = await Recording.create({
    title,
    status: 'PENDING',
    Job: {
      source: url,
      startDate,
      duration,
      UserId: user.id
    },
    UserId: user.id
  }, { include: Job })
  reply.send(recording)
  if (startDate.getTime() > nowDate.getTime()) {
    request.log.verbose('Scheduling new job: ' + dateStart)
    this.schedule.scheduleJob(
      startDate,
      function (recording) { downloadVideo(recording.Job) }
        .bind(null, recording)
    )
  } else {
    request.log.verbose('Executing new job NOW')
    downloadVideo(recording.Job)
  }
}
