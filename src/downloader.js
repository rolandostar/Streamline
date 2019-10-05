'use strict'

const fp = require('fastify-plugin')
const path = require('path')
const fs = require('fs')
const child_process = require('child_process')

async function downloader (fastify, opts) {
  fastify.decorate('downloadVideo', async (jobInstance) => {
    const recording = jobInstance.Recording ? jobInstance.Recording : await jobInstance.getRecording()
    const user = await jobInstance.getUser()
    const execFilePath = path.join('./modules', process.platform === 'win32' ? 'youtube-dl.exe' : 'youtube-dl')
    let opts = [
      '--get-filename',
      '--config-location', 'modules',
      '-o', `storage/${user.id}/source/%(title)s.%(ext)s`,
      `${jobInstance.source}`
    ]
    const dateEnd = new Date(jobInstance.endDate)
    fastify.log.warn(`Begin download "${recording.title}" from ${jobInstance.source} until ${jobInstance.endDate} for user: ${user.username}`)
    await jobInstance.destroy()
    try {
      const stdout = child_process.execFileSync(execFilePath, opts)
      await recording.update({ filename: path.basename(stdout.toString()) })
      await recording.update({ status: 'DOWNLOADING' })
      opts.shift();
      const child = child_process.execFile(execFilePath, opts, async (error, stdout, stderr) => {
        if(error) {
          await recording.update({ status: 'DOWNLOAD_ERROR' })
        } else {
          fastify.log.warn(`Finished download of "${recording.title}" from ${jobInstance.source} for user: ${user.username}`)
          await recording.update({ status: 'DOWNLOADED' })
          fastify.encodeVideo(recording)
        }
      })
      // Kill at dateEnd
      fastify.schedule.scheduleJob(dateEnd, function (child) {
        fastify.log.warn('End Date Reached - Attempting to stop download.')
        child.kill('SIGINT')
      }.bind(null, child))
    } catch (err) {
      fastify.log.error(err)
      await recording.update({ status: 'RESOLVE_ERROR' })
    }
  })
}

module.exports = fp(downloader, {
  fastify: '>=0.13.1',
  decorators: {
    fastify: ['chalk', 'encodeVideo']
  }
})
