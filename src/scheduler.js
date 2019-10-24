'use strict'

const fp = require('fastify-plugin')

const { timemarkToSeconds } = require('./util')

function scheduler (fastify, opts, done) {
  const { Job, Recording } = fastify.sequelize.models
  fastify.decorate('schedule', require('node-schedule'))
  Recording.findAll({ include: { model: Job, paranoid: false } }).then(function (recordings) {
    for (let index = 0; index < recordings.length; index++) {
      const recording = recordings[index]
      const startDate = new Date(recording.Job.startDate)
      switch (recording.status) {
        case 'PACKAGING':
          console.log(`${recording.title} was interrupted during packaging. Retrying...`)
          break
        case 'ENCODING':
          console.log(`${recording.title} was interrupted during encoding. Retrying...`)
          fastify.encodeVideo(recording)
          break
        case 'RESOLVING':
        case 'DOWNLOADING':
          const now = new Date()
          const duration = timemarkToSeconds(recording.Job.duration)
          const endDate = new Date(startDate.getTime() + (duration * 1000))
          if (endDate.getTime() > now.getTime()) {
            const diff = new Date(endDate.getTime() - now.getTime())
            fastify.log.verbose(`${recording.title} was interrupted during download, Restarting from NOW until: ${endDate}`)
            recording.Job.update({ duration: diff.toISOString().substr(11, 8) })
            fastify.downloadVideo(recording.Job)
          } else {
            fastify.log.verbose(`${recording.title} was interrupted during download, unable to restart since content window has expired.`)
            recording.update({ status: 'DOWNLOAD_ERROR' })
          }
          break
        case 'PENDING':
          fastify.log.verbose(`"${recording.title}" scheduled for: ${startDate}`)
          fastify.schedule.scheduleJob(startDate, function (recording) {
            fastify.downloadVideo(recording.Job)
          }.bind(null, recording))
          break
      }
      done()
    }
  })
}

module.exports = fp(scheduler, {
  fastify: '>=0.13.1',
  decorators: {
    fastify: ['chalk', 'downloadVideo', 'encodeVideo']
  }
})
