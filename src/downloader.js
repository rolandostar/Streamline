'use strict'

const fp = require('fastify-plugin')

async function downloader (fastify, opts) {
  fastify.decorate('downloadVideo', async (jobInstance) => {
    const recording = jobInstance.Recording ? jobInstance.Recording : await jobInstance.getRecording()
    fastify.log.info(`Begin download "${recording.title}" from ${jobInstance.source} until ${jobInstance.endDate}`)
    jobInstance.destroy() // Job is finished
    recording.update({ status: 'DOWNLOADING' })
    // TODO: Send to download
  })
}

module.exports = fp(downloader, {
  fastify: '>=0.13.1',
  decorators: {
    fastify: ['chalk']
  }
})
