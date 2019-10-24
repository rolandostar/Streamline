'use strict'

const { timemarkToSeconds } = require('./util')
const fp = require('fastify-plugin')
const fs = require('fs')
const path = require('path')
const util = require('util')
const execFile = util.promisify(require('child_process').execFile)
const ThumbnailGenerator = require('video-thumbnail-generator').default
const ffmpeg = require('fluent-ffmpeg')

async function downloader (fastify, opts) {
  fastify.decorate('downloadVideo', async (jobInstance) => {
    const recording = jobInstance.Recording ? jobInstance.Recording : await jobInstance.getRecording()
    const user = await jobInstance.getUser()
    const ytDownloader = './modules/youtube-dl'
    const dateStart = new Date(jobInstance.startDate)
    const dateEnd = new Date(jobInstance.endDate)
    const timeDiff = (dateEnd.getTime() - dateStart.getTime()) / 1000
    fastify.log.verbose(`[${fastify.chalk.green('DOWNLOAD')}] "${recording.title}"\n      URL: ${jobInstance.source}\nFecha Fin: ${jobInstance.endDate}\n Segundos: ${timeDiff}\n  Usuario: ${user.username}`)
    Promise.all([
      execFile(ytDownloader, [
        '--get-url',
        '-f', 'bestvideo[height<=?1080]',
        `${jobInstance.source}`
      ]),
      execFile(ytDownloader, [
        '--get-url',
        '-f', 'bestaudio',
        `${jobInstance.source}`
      ]),
      execFile(ytDownloader, [
        '--get-filename',
        '--restrict-filenames',
        '-o', `storage/${user.id}/${dateStart.getTime() / 1000}-%(title)s/original-%(height)s.mp4`,
        '-f', 'bestvideo[height<=?1080]',
        `${jobInstance.source}`
      ])
    ]).then(function (values) {
      const [ { stdout: ytVideoUrl }, { stdout: ytAudioUrl }, { stdout: ytVideoFilename } ] = values
      fastify.log.verbose(`[${fastify.chalk.green('DOWNLOAD')}] Detected dual track stream.`)
      fastify.log.debug(`=> Video Track: ${ytVideoUrl}`)
      fastify.log.debug(`=> Audio Track: ${ytAudioUrl}`)
      const videoFileName = ytVideoFilename.trim()
      const dir = path.dirname(videoFileName)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir)
      ffmpeg(ytVideoUrl.trim())
        .on('start', function (commandLine) { fastify.log.debug(`=> FFMPEG Video(only) command: ${commandLine}`) })
        .on('progress', function (progress) {
          console.log(progress)
          if (timemarkToSeconds(progress.timemark) > 3) this.ffmpegProc.stdin.write('q') // Exit once timeDiff is reached
        })
        .on('error', function (err, stdout, stderr) { fastify.log.error(`=> FFMPEG Video(only) error: ${err.message}`) })
        .on('end', function (stdout, stderr) {
          fastify.log.verbose(`[${fastify.chalk.green('DOWNLOAD')}] Video(Only) Finished download`)
        })
        .save(videoFileName)
      ffmpeg(ytAudioUrl.trim())
        .on('start', function (commandLine) { fastify.log.debug(`=> FFMPEG Audio(only) command: ${commandLine}`) })
        .on('progress', function (progress) {
          console.log(progress)
        })
        .on('error', function (err, stdout, stderr) { fastify.log.error(`=> FFMPEG Audio(only) error: ${err.message}`) })
        .on('end', function (stdout, stderr) {
          fastify.log.verbose(`[${fastify.chalk.green('DOWNLOAD')}] Audio(Only) Finished download`)
        })
        .save(dir + '/audio.mp4')
    }).catch(function (reason) {
      console.error('fail\n' + reason)
      process.stdout.write('attempting best single track...')

      Promise.all([
        execFile(ytDownloader, [
          '--get-filename',
          '-f', 'best[height<=?1080]',
          `${jobInstance.source}`
        ]),
        execFile(ytDownloader, [
          '--get-url',
          '-f', 'best[height<=?1080]',
          `${jobInstance.source}`
        ])
      ])

      execFile(ytDownloader, [
        '--get-url',
        '-f', 'best[height<=?1080]',
        `${jobInstance.source}`
      ]).then(function ({ stdout: ytAVUrl }) {
        console.log('success')
        console.log(`=> Video/Audio: ${ytAVUrl}`)
        ffmpeg(ytAVUrl.trim())
          .on('progress', function (progress) {
            console.log(timemarkToSeconds(progress.timemark))
          })
          .save('audiovideo.mp4')
      }).catch(error => {
        console.error('fail\n' + error)
        // TODO: NOT SUPPORTED!!
      })
    })

    // const { stdout: ytVideoUrl, stderr: errVideo } = await
    // const { stdout: ytAudioUrl, stderr: errAudio } = await
    // if (!errVideo && !errAudio) {
    //   console.log('success')
    //   console.log(`=> Video Track: ${ytVideoUrl}`)
    //   console.log(`=> Audio Track: ${ytAudioUrl}`)
    // } else {



    //   if (!stderr) {
    //     console.log('success')
    //     console.log(`=> Video/Audio: ${ytAVUrl}`)
    //   } else {
    //     console.error('fail\n' + stderr)
    //   }
    // }
    // try {
    //   const ytFilename = childProcess.execFileSync(ytModule, ytArgs)

    //   // get url for best video with height lower or at 1080 with youtube-dl
    //   ytArgs[0] = '--get-url'
    //   const ytVideoUrl = childProcess.execFileSync(ytModule, ytArgs)

    //   // get url for best audio with youtube-dl
    //   ytArgs[3] = 'bestaudio'
    //   const ytAudioUrl = childProcess.execFileSync(ytModule, ytArgs)
    // } catch (err) {
    //   fastify.log.error(err)
    //   return
    // }

    // download both using fluent, into separate files
    // try {
    //   ffmpeg(ytVideoUrl)
    // } catch (err) { console.log(err) }


    // await jobInstance.destroy()
    // try {
    //   const stdout = childProcess.execFileSync(execFilePath, args)
    //   const dir = path.basename(path.dirname(stdout.toString()))
    //   await recording.update({
    //     dirName: dir,
    //     status: 'DOWNLOADING'
    //   })
    //   args.shift()
    //   const child = childProcess.execFile(execFilePath, args, async (error, stdout, stderr) => {
    //     if (error) {
    //       fastify.log.error(error)
    //       await recording.update({ status: 'DOWNLOAD_ERROR' })
    //     } else {
    //       fastify.log.warn(`Finished download of "${recording.title}" from ${jobInstance.source} for user: ${user.username}`)
    //       await recording.update({ status: 'DOWNLOADED' })
    //       const videoDir = path.join(`./storage/${user.id}`, dir)
    //       const tg = new ThumbnailGenerator({
    //         sourcePath: path.join(videoDir, 'original.mp4'),
    //         thumbnailPath: videoDir
    //       })
    //       const thumbnailFilename = await tg.generateOneByPercent(35, { size: '290x160', filename: 'thumb.png' })
    //       fastify.log.info(thumbnailFilename)
    //       fastify.encodeVideo(recording)
    //     }
    //   })
    //   // Kill at dateEnd
    //   fastify.schedule.scheduleJob(dateEnd, function (child) {
    //     fastify.log.warn('End Date Reached - Attempting to stop download.')
    //     child.kill('SIGINT')
    //   }.bind(null, child))
    // } catch (err) {
    //   fastify.log.error(err)
    //   await recording.update({ status: 'RESOLVE_ERROR' })
    // }
  })
}

module.exports = fp(downloader, {
  fastify: '>=0.13.1',
  decorators: {
    fastify: ['chalk', 'encodeVideo']
  }
})
