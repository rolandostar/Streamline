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
      const now = new Date()
      switch (recording.status) {
        case 'PACKAGING':
          console.log(`${recording.title} was interrupted during packaging. Retrying...`)
          const cwd = `./storage/${recording.UserId}/${recording.dirName}/`
          const mpdArgs = fastify.findArguments(cwd)
          console.log(mpdArgs)
          fastify.generateManifest(mpdArgs, cwd).then(() => {
            fastify.log.warn('Finished packaging')
            recording.update({ status: 'READY' })
            fastify.sse.livePush({
              target: recording.id,
              source: 'packager',
              type: 'done',
              downloadedAt: recording.createdAt
            })
          })
          break
        case 'ENCODING':
          console.log(`${recording.title} was interrupted during encoding. Retrying...`)
          fastify.encodeVideo(recording)
          break
        case 'RESOLVING':
        case 'DOWNLOADING':

          if (recording.Job.duration !== 'None') {
            const endDate = new Date(startDate.getTime() + (timemarkToSeconds(recording.Job.duration) * 1000))
            if (endDate.getTime() > now.getTime()) {
              const diff = new Date(endDate.getTime() - now.getTime())
              fastify.log.verbose(`${recording.title} was interrupted during download, Restarting from NOW until: ${endDate}`)
              recording.Job.update({ duration: diff.toISOString().substr(11, 8) })
              fastify.downloadVideo(recording.Job)
            } else {
              fastify.log.verbose(`${recording.title} was interrupted during download, unable to restart since content window has expired.`)
              recording.update({ status: 'DOWNLOAD_ERROR' })
            }
          } else {
            fastify.log.verbose(`${recording.title} was interrupted during download, Restarting from NOW until download is done.`)
            fastify.downloadVideo(recording.Job)
          }
          break
        case 'PENDING':
          if (startDate.getTime() < now.getTime()) recording.update({ status: 'DOWNLOAD_ERROR' })
          else {
            fastify.log.verbose(`"${recording.title}" scheduled for: ${startDate}`)
            fastify.schedule.scheduleJob(startDate, function (recording) {
              fastify.downloadVideo(recording.Job)
            }.bind(null, recording))
          }
          break
      }
    }
    done()
  // eslint-disable-next-line handle-callback-err
  }).catch(function (err) { done() })
}

module.exports = fp(scheduler, {
  fastify: '>=0.13.1',
  decorators: {
    fastify: ['chalk', 'downloadVideo', 'encodeVideo', 'findArguments']
  }
})
