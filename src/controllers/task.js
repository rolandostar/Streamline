'use strict'

module.exports.list = function (request, reply) { reply.send() }
module.exports.lookup = function (request, reply) { reply.send() }
module.exports.edit = function (request, reply) { reply.send() }
module.exports.delete = function (request, reply) { reply.send() }
module.exports.create = async function (request, reply) {
  console.log(this.hasDecorator('downloadVideo'))
  const { downloadVideo } = this
  const { Recording, Job } = this.sequelize.models
  const { title, url, dateStart, dateEnd } = request.body
  const startDate = new Date(dateStart)
  const endDate = new Date(dateEnd)
  const recording = await Recording.create({
    title,
    status: 'PENDING',
    Job: {
      source: url,
      startDate,
      endDate
    }
  }, { include: Job })
  recording.setUser(request.user.id)
  recording.Job.setUser(request.user.id)
  request.log.info('Scheduling new job: ' + dateStart)
  this.schedule.scheduleJob(
    startDate,
    function (recording) { downloadVideo(recording.Job) }
      .bind(null, recording)
  )
  reply.send()
}
