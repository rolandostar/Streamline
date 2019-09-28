'use strict'

const fp = require('fastify-plugin')

function scheduler (fastify, opts, done) {
  const { Job, Recording } = fastify.sequelize.models
  fastify.decorate('schedule', require('node-schedule'))
  Job.findAll({ include: Recording }).then(function (jobs) {
    for (let index = 0; index < jobs.length; index++) {
      const job = jobs[index]
      const startDate = new Date(job.startDate)
      const now = new Date()
      if (startDate.getTime() < now.getTime()) {
        fastify.downloadVideo(job)
      } else {
        fastify.schedule.scheduleJob(startDate, function (job) {
          fastify.downloadVideo(job)
        }.bind(null, job))
      }
    }
    done()
  })
}

module.exports = fp(scheduler, {
  fastify: '>=0.13.1',
  decorators: {
    fastify: ['chalk', 'downloadVideo']
  }
})
