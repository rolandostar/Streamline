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
  fastify.decorate('downloadVideo', async (job) => {
    const recording = job.Recording ? job.Recording : await job.getRecording()
    // return fastify.encodeVideo(recording)
    const user = await job.getUser()
    const ytDownloader = './bin/youtube-dl'
    const dateStart = new Date(job.startDate)
    const durationSeconds = job.duration !== 'None' ? timemarkToSeconds(job.duration) : null

    if (!fs.existsSync(`storage/${user.id}`)) fs.mkdirSync(`storage/${user.id}`)
    fastify.log.verbose(`[${fastify.chalk.green('DOWNLOAD')}] "${recording.title}"\n      URL: ${job.source}\n Duración: ${durationSeconds} segundos\n  Usuario: ${user.username}`)
    fastify.log.verbose(`[${fastify.chalk.green('DOWNLOAD')}] Attempting to find track url(s)...`)
    recording.update({ status: 'RESOLVING' })
    fastify.sse.livePush({
      target: recording.id,
      source: 'resolver',
      type: 'start'
    })

    Promise.all([
      execFile(ytDownloader, [
        job.source,
        '-j',
        '--restrict-filename',
        // '-f', 'bestvideo[height<=1080]+bestaudio',
        '-o', `storage/${user.id}/${dateStart.getTime() / 1000}-%(title)s/original-%(height)s.%(ext)s`
      ])
    ]).then(([{ stdout: content }]) => {
      const info = JSON.parse(content)
      const dir = path.dirname(info._filename)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir)
      // Report console
      if (info.requested_formats) {
        fastify.log.verbose(`[${fastify.chalk.green('DOWNLOAD')}] Dual stream available. Begin download...`)
      } else {
        fastify.log.verbose(`[${fastify.chalk.green('DOWNLOAD')}] Single stream available. Begin download...`)
      }
      const video = info.requested_formats ? info.requested_formats[0] : info
      // Report Fronend
      fastify.sse.livePush({
        target: recording.id,
        source: 'resolver',
        type: 'done'
      })
      // Report DB
      recording.update({ status: 'DOWNLOADING', dirName: path.basename(dir) })
      // Execute
      Promise.all([
        new Promise((resolve, reject) => {
          const cmd = ffmpeg(video.url.trim())
            .videoCodec('copy')
            .audioCodec('copy')
            .on('start', function (commandLine) { fastify.log.vdebug(`=> FFMPEG Video ${fastify.chalk.magenta('command')}: ${commandLine}`) })
            .on('progress', (progress) => {
              console.log(progress)
              const currentProgress = ((timemarkToSeconds(progress.timemark) * 100) / durationSeconds).toFixed(1)
              fastify.sse.livePush({
                target: recording.id,
                source: 'downloader',
                type: 'progress',
                progress: currentProgress
              })
            })
            .on('error', function (err, stdout, stderr) {
              fastify.log.error(`=> FFMPEG Video error: ${err.message}`)
              fastify.log.error(stderr)
              reject(err)
            })
            .on('end', function (stdout, stderr) {
              fastify.log.verbose(`[${fastify.chalk.green('DOWNLOAD')}] Video Finished download`)
              if (info.requested_formats) return resolve()
              // Extract audio from video
              ffmpeg(dir + '/original-' + video.height + '.' + video.ext)
                .noVideo()
                .audioCodec('aac')
                .on('end', () => { resolve() })
                .save(dir + '/audio.mp4')
            })
          if (durationSeconds) cmd.duration(durationSeconds)
          cmd.output(dir + '/original-' + video.height + '.' + video.ext)
          cmd.run()
        }),
        new Promise((resolve, reject) => {
          if (!info.requested_formats || !info.requested_formats[1]) resolve()
          const audio = info.requested_formats[1]
          const cmd = ffmpeg(audio.url)
            .audioCodec('aac')
            .on('start', function (commandLine) { fastify.log.vdebug(`=> FFMPEG Audio ${fastify.chalk.magenta('command')}: ${commandLine}`) })
            .on('progress', (progress) => {
              console.log(progress)
            })
            .on('error', function (err, stdout, stderr) {
              fastify.log.error(`=> FFMPEG Audio error: ${err.message}`)
              fastify.log.error(stderr)
              reject(err)
            })
            .on('end', function (stdout, stderr) {
              fastify.log.verbose(`[${fastify.chalk.green('DOWNLOAD')}] Audio Finished download`)
              resolve()
            })
            .output(dir + '/audio.mp4')
          if (durationSeconds) cmd.duration(durationSeconds)
          cmd.run()
        })
      ]).then(values => {
        const tg = new ThumbnailGenerator({
          sourcePath: dir + '/original-' + video.height + '.' + video.ext,
          thumbnailPath: dir
        })
        tg.generateOneByPercent(30, { size: '290x160', filename: 'thumb.png' }).then(async function () {
          job.destroy()
          fastify.sse.livePush({
            target: recording.id,
            source: 'downloader',
            type: 'done',
            user: user.id,
            dirName: path.basename(dir)
          })
          fastify.encodeVideo(recording)
        })
      })
    })

    // Promise.all([
    //   execFile(ytDownloader, [
    //     `${job.source}`,
    //     '--get-url',
    //     '-f', 'bestvideo[height<=?1080]'
    //   ]),
    //   execFile(ytDownloader, [
    //     `${job.source}`,
    //     '--get-url',
    //     '-f', 'bestaudio'
    //   ]),
    //   execFile(ytDownloader, [
    //     `${job.source}`,
    //     '--get-filename',
    //     '-f', 'bestvideo[height<=?1080]',
    //     '--restrict-filenames',
    //     '-o', `storage/${user.id}/${dateStart.getTime() / 1000}-%(title)s/original-%(height)s.%(ext)s`
    //   ])
    // ]).then(function (values) {
    //   /* ---------------------------- Dual Track ---------------------------- */
    //   const [ { stdout: ytVideoUrl }, { stdout: ytAudioUrl }, { stdout: ytVideoFilename } ] = values
    //   fastify.log.verbose(`[${fastify.chalk.green('DOWNLOAD')}] Dual stream available. Begin download...`)
    //   fastify.log.vdebug(`=> Video Track ${fastify.chalk.yellow('URL')}: ${ytVideoUrl}`)
    //   fastify.log.vdebug(`=> Audio Track ${fastify.chalk.yellow('URL')}: ${ytAudioUrl}`)
    //   const videoFileName = ytVideoFilename.trim()
    //   const dir = path.dirname(videoFileName)
    //   const videoFileNameOnly = path.basename(videoFileName)
    //   // const mpdArgs = [
    //   //   'in=audio.mp4,stream=audio,output=audio.mp4',
    //   //   `in=${videoFileNameOnly},stream=video,output=${videoFileNameOnly}`,
    //   //   '--mpd_output', 'manifest.mpd'
    //   // ]
    //   if (!fs.existsSync(dir)) fs.mkdirSync(dir)
    //   recording.update({ status: 'DOWNLOADING', dirName: path.basename(dir) })
    //   fastify.sse.livePush({
    //     target: recording.id,
    //     source: 'resolver',
    //     type: 'done'
    //   })
    //   Promise.all([
    //     new Promise((resolve, reject) => {
    //       const cmd = ffmpeg(ytVideoUrl.trim())
    //         .outputOptions([
    //           '-c:v copy'
    //         ])
    //         .on('start', function (commandLine) { fastify.log.vdebug(`=> FFMPEG Video(only) ${fastify.chalk.magenta('command')}: ${commandLine}`) })
    //         .on('progress', durationSeconds ? function (progress) {
    //           const currentProgress = ((timemarkToSeconds(progress.timemark) * 100) / durationSeconds).toFixed(1)
    //           fastify.log.vdebug(`FFMPEG FFMPEG Video(only) progress: ${currentProgress}%`)
    //           fastify.sse.livePush({
    //             target: recording.id,
    //             source: 'downloader',
    //             type: 'progress',
    //             progress: currentProgress
    //           })
    //         } : (progress) => { fastify.log.vdebug(`FFMPEG Audio+Video(Video Portion) progress: ${progress}%`) })
    //         .on('error', function (err, stdout, stderr) {
    //           fastify.log.error(`=> FFMPEG Video(only) error: ${err.message}`)
    //           reject(err)
    //         })
    //         .on('end', function (stdout, stderr) {
    //           fastify.log.verbose(`[${fastify.chalk.green('DOWNLOAD')}] Video(Only) Finished download`)
    //           resolve()
    //         })
    //         .output(videoFileName)
    //       if (durationSeconds) cmd.duration(durationSeconds)
    //       cmd.run()
    //     }),
    //     new Promise((resolve, reject) => {
    //       const cmd = ffmpeg(ytAudioUrl.trim())
    //         .outputOptions([
    //           '-c:a aac'
    //         ])
    //         .on('start', function (commandLine) { fastify.log.vdebug(`=> FFMPEG Audio(only) ${fastify.chalk.magenta('command')}: ${commandLine}`) })
    //         .on('progress', durationSeconds ? function (progress) {
    //           const currentProgress = ((timemarkToSeconds(progress.timemark) * 100) / durationSeconds).toFixed(1)
    //           fastify.log.vdebug(`FFMPEG FFMPEG Audio(only) progress: \t${currentProgress}%`)
    //         } : (progress) => { fastify.log.vdebug(`FFMPEG Audio+Video(Video Portion) progress: ${progress}%`) })
    //         .on('error', function (err, stdout, stderr) {
    //           fastify.log.error(`=> FFMPEG Audio(only) error: ${err.message}`)
    //           fastify.log.error(stderr)
    //           reject(err)
    //         })
    //         .on('end', function (stdout, stderr) {
    //           fastify.log.verbose(`[${fastify.chalk.green('DOWNLOAD')}] Audio(Only) Finished download`)
    //           resolve()
    //         })
    //         .output(dir + '/audio.mp4')
    //       if (durationSeconds) cmd.duration(durationSeconds)
    //       cmd.run()
    //     })
    //   ]).then(function (values) {
    //     const tg = new ThumbnailGenerator({
    //       sourcePath: videoFileName,
    //       thumbnailPath: dir
    //     })
    //     tg.generateOneByPercent(30, { size: '290x160', filename: 'thumb.png' }).then(async function () {
    //       await fastify.generateManifest([videoFileNameOnly], dir)
    //       job.destroy()
    //       fastify.sse.livePush({
    //         target: recording.id,
    //         source: 'downloader',
    //         type: 'done',
    //         user: user.id,
    //         dirName: path.basename(dir)
    //       })
    //       fastify.encodeVideo(recording)
    //     })
    //   }).catch(function (reason) {
    //     fastify.log.error(reason)
    //     recording.update({ status: 'DOWNLOAD_ERROR' })
    //   })
    // }).catch(function (reason) {
    //   /* --------------------------- Single Track --------------------------- */
    //   fastify.log.verbose(`[${fastify.chalk.green('DOWNLOAD')}] Attempting to find single track url...`)
    //   Promise.all([
    //     execFile(ytDownloader, [
    //       '--get-url',
    //       '-f', 'best[height<=?1080]',
    //       `${job.source}`
    //     ]),
    //     execFile(ytDownloader, [
    //       '--get-filename',
    //       '--restrict-filenames',
    //       '-o', `storage/${user.id}/${dateStart.getTime() / 1000}-%(title)s/original-%(height)s.%(ext)s`,
    //       '-f', 'best[height<=?1080]',
    //       `${job.source}`
    //     ])
    //   ]).then(function (values) {
    //     const [ { stdout: ytAVUrl }, { stdout: ytVideoFilename } ] = values
    //     fastify.log.verbose(`[${fastify.chalk.green('DOWNLOAD')}] Single stream available. Begin download...`)
    //     fastify.log.vdebug(`=> Video/Audio ${fastify.chalk.yellow('URL')}: ${ytAVUrl}`)
    //     const videoFileName = ytVideoFilename.trim()
    //     const dir = path.dirname(videoFileName)
    //     const videoFileNameOnly = path.basename(videoFileName)
    //     // const mpdArgs = [
    //     //   'in=audio.mp4,stream=audio,output=audio.mp4',
    //     //   `in=${videoFileNameOnly},stream=video,output=${videoFileNameOnly}`,
    //     //   '--mpd_output', 'manifest.mpd'
    //     // ]
    //     if (!fs.existsSync(dir)) fs.mkdirSync(dir)
    //     recording.update({ status: 'DOWNLOADING', dirName: path.basename(dir) })
    //     fastify.sse.livePush({
    //       target: recording.id,
    //       source: 'resolver',
    //       type: 'done'
    //     })
    //     Promise.all([
    //       new Promise((resolve, reject) => {
    //         const cmd = ffmpeg(ytAVUrl.trim())
    //           .outputOptions([
    //             '-c:a aac',
    //             '-c:v copy'
    //           ])
    //           .on('start', function (commandLine) { fastify.log.vdebug(`=> FFMPEG Audio+Video (Video Portion) ${fastify.chalk.magenta('command')}: ${commandLine}`) })
    //           .on('progress', durationSeconds ? function (progress) {
    //             const currentProgress = ((timemarkToSeconds(progress.timemark) * 100) / durationSeconds).toFixed(1)
    //             fastify.log.vdebug(`FFMPEG Audio+Video(Video Portion) progress: ${currentProgress}%`)
    //             fastify.sse.livePush({
    //               target: recording.id,
    //               source: 'downloader',
    //               type: 'progress',
    //               progress: currentProgress
    //             })
    //           } : (progress) => { fastify.log.vdebug(`FFMPEG Audio+Video(Video Portion) progress: ${progress}%`) })
    //           .on('error', function (err, stdout, stderr) {
    //             fastify.log.error(`=> FFMPEG Audio+Video error: ${err.message}`)
    //             reject(err)
    //           })
    //           .on('end', function (stdout, stderr) {
    //             fastify.log.verbose(`[${fastify.chalk.green('DOWNLOAD')}] Audio+Video (Video Portion) Finished download`)
    //             resolve()
    //           })
    //           .output(videoFileName)
    //         if (durationSeconds) cmd.duration(durationSeconds)
    //         cmd.run()
    //       }),
    //       // new Promise((resolve, reject) => {
    //       //   ffmpeg(ytAVUrl.trim())
    //       //     .duration(durationSeconds)
    //       //     .noVideo()
    //       //     .on('start', function (commandLine) { fastify.log.vdebug(`=> FFMPEG Audio+Video (Audio Portion) ${fastify.chalk.magenta('command')}: ${commandLine}`) })
    //       //     .on('progress', function (progress) {
    //       //       const currentProgress = (timemarkToSeconds(progress.timemark) * 100) / durationSeconds
    //       //       fastify.log.vdebug(`FFMPEG Audio+Video(Audio Portion) progress: \t${currentProgress}%`)
    //       //     })
    //       //     .on('error', function (err, stdout, stderr) {
    //       //       fastify.log.error(`=> FFMPEG Audio+Video (Audio Portion) error: ${err.message}`)
    //       //       reject(err)
    //       //     })
    //       //     .on('end', function (stdout, stderr) {
    //       //       fastify.log.verbose(`[${fastify.chalk.green('DOWNLOAD')}] Audio+Video (Audio Portion) Finished download`)
    //       //       resolve()
    //       //     })
    //       //     .save(dir + '/audio.mp4')
    //       // })
    //     ]).then(function (values) {
    //       const cmd = ffmpeg(videoFileName)
    //           .outputOptions([
    //             '-c:a aac'
    //           ])
    //           .noVideo()
    //           .on('start', function (commandLine) { fastify.log.vdebug(`=> FFMPEG Audio+Video (Audio Portion) ${fastify.chalk.magenta('command')}: ${commandLine}`) })
    //           .on('progress', durationSeconds ? function (progress) {
    //             const currentProgress = ((timemarkToSeconds(progress.timemark) * 100) / durationSeconds).toFixed(1)
    //             fastify.log.vdebug(`FFMPEG Audio+Video(Audio Portion) progress: ${currentProgress}%`)
    //             fastify.sse.livePush({
    //               target: recording.id,
    //               source: 'downloader',
    //               type: 'progress',
    //               progress: currentProgress
    //             })
    //           } : (progress) => { fastify.log.vdebug(`FFMPEG Audio+Video(Video Portion) progress: ${progress}%`) })
    //           .on('error', function (err, stdout, stderr) {
    //             fastify.log.error(`=> FFMPEG Audio+Video error: ${err.message}`)
    //           })
    //           .on('end', async function (stdout, stderr) {
    //             fastify.log.verbose(`[${fastify.chalk.green('DOWNLOAD')}] Audio+Video (Audio Portion) Finished download`)
    //             const tg = new ThumbnailGenerator({
    //               sourcePath: videoFileName,
    //               thumbnailPath: dir
    //             })

    //             tg.generateOneByPercent(30, { size: '290x160', filename: 'thumb.png' }).then(async function () {
    //               await fastify.generateManifest([videoFileNameOnly], dir)
    //               job.destroy()
    //               fastify.sse.livePush({
    //                 target: recording.id,
    //                 source: 'downloader',
    //                 type: 'done',
    //                 user: user.id,
    //                 dirName: path.basename(dir)
    //               })
    //               fastify.encodeVideo(recording)
    //             })
    //           })
    //           .output(dir + '/audio.mp4')
    //         if (durationSeconds) cmd.duration(durationSeconds)
    //         cmd.run()

    //     }).catch(function (reason) {
    //       fastify.log.error(reason)
    //       recording.update({ status: 'DOWNLOAD_ERROR' })
    //       fastify.sse.livePush({
    //         target: recording.id,
    //         source: 'downloader',
    //         type: 'error',
    //         subtype: 'download'
    //       })
    //     })
    //   }).catch(function (reason) {
    //     fastify.log.error(reason)
    //     fastify.sse.livePush({
    //       target: recording.id,
    //       source: 'downloader',
    //       type: 'error',
    //       subtype: 'resolve'
    //     })
    //     recording.update({ status: 'RESOLVE_ERROR' })
    //   })
    // })
  })
}

module.exports = fp(downloader, {
  fastify: '>=0.13.1',
  decorators: {
    fastify: ['chalk', 'encodeVideo']
  }
})
