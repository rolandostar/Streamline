'use strict'

const fp = require('fastify-plugin')
const path = require('path')
const childProcess = require('child_process')

async function downloader (fastify, opts) {
  fastify.decorate('downloadVideo', async (jobInstance) => {
    const recording = jobInstance.Recording ? jobInstance.Recording : await jobInstance.getRecording()
    const user = await jobInstance.getUser()
    const execFilePath = path.join('./modules', process.platform === 'win32' ? 'youtube-dl.exe' : 'youtube-dl')
    let args = [
      '--get-filename',
      '--config-location', 'modules',
      '-o', `storage/${user.id}/%(title)s/original.mp4`,
      `${jobInstance.source}`
    ]
    const dateEnd = new Date(jobInstance.endDate)
    fastify.log.warn(`Begin download "${recording.title}" from ${jobInstance.source} until ${jobInstance.endDate} for user: ${user.username}`)
    await jobInstance.destroy()
    try {
      const stdout = childProcess.execFileSync(execFilePath, args)
      await recording.update({
        filename: path.basename(path.dirname(stdout.toString())),
        status: 'DOWNLOADING'
      })
      args.shift()
      const child = childProcess.execFile(execFilePath, args, async (error, stdout, stderr) => {
        if (error) {
          fastify.log.error(error)
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
