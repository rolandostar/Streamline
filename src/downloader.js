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
    const ytDownloader = './modules/youtube-dl'
    const dateStart = new Date(job.startDate)
    const durationSeconds = timemarkToSeconds(job.duration)

    if (!fs.existsSync(`storage/${user.id}`)) fs.mkdirSync(`storage/${user.id}`)
    fastify.log.verbose(`[${fastify.chalk.green('DOWNLOAD')}] "${recording.title}"\n      URL: ${job.source}\n Duración: ${durationSeconds} segundos\n  Usuario: ${user.username}`)
    fastify.log.verbose(`[${fastify.chalk.green('DOWNLOAD')}] Attempting to find dual track urls...`)
    recording.update({ status: 'RESOLVING' })
    Promise.all([
      execFile(ytDownloader, [
        `${job.source}`,
        '--get-url',
        '-f', 'bestvideo[height<=?1080]'
      ]),
      execFile(ytDownloader, [
        `${job.source}`,
        '--get-url',
        '-f', 'bestaudio'
      ]),
      execFile(ytDownloader, [
        `${job.source}`,
        '--get-filename',
        '-f', 'bestvideo[height<=?1080]',
        '--restrict-filenames',
        '-o', `storage/${user.id}/${dateStart.getTime() / 1000}-%(title)s/original-%(height)s.mp4`,
      ])
    ]).then(function (values) {
      const [ { stdout: ytVideoUrl }, { stdout: ytAudioUrl }, { stdout: ytVideoFilename } ] = values
      fastify.log.verbose(`[${fastify.chalk.green('DOWNLOAD')}] Dual stream available. Begin download...`)
      fastify.log.vdebug(`=> Video Track ${fastify.chalk.yellow('URL')}: ${ytVideoUrl}`)
      fastify.log.vdebug(`=> Audio Track ${fastify.chalk.yellow('URL')}: ${ytAudioUrl}`)
      const videoFileName = ytVideoFilename.trim()
      const dir = path.dirname(videoFileName)
      const videoFileNameOnly = path.basename(videoFileName)
      const mpdArgs = [
        'in=audio.mp4,stream=audio,output=audio.mp4',
        `in=${videoFileNameOnly},stream=video,output=${videoFileNameOnly}`,
        '--mpd_output', 'manifest.mpd'
      ]
      if (!fs.existsSync(dir)) fs.mkdirSync(dir)
      recording.update({ status: 'DOWNLOADING', dirName: path.basename(dir) })
      Promise.all([
        new Promise((resolve, reject) => {
          ffmpeg(ytVideoUrl.trim())
            .duration(durationSeconds)
            .on('start', function (commandLine) { fastify.log.vdebug(`=> FFMPEG Video(only) ${fastify.chalk.magenta('command')}: ${commandLine}`) })
            .on('progress', function (progress) {
              const currentProgress = ((timemarkToSeconds(progress.timemark) * 100) / durationSeconds).toFixed(1)
              fastify.log.vdebug(`FFMPEG FFMPEG Video(only) progress: ${currentProgress}%`)
              fastify.sse.reportProgress({
                target: recording.id,
                source: 'downloader',
                type: 'progress',
                progress: currentProgress
              })
            })
            .on('error', function (err, stdout, stderr) {
              fastify.log.error(`=> FFMPEG Video(only) error: ${err.message}`)
              reject(err)
            })
            .on('end', function (stdout, stderr) {
              fastify.log.verbose(`[${fastify.chalk.green('DOWNLOAD')}] Video(Only) Finished download`)
              resolve()
            })
            .thumbnail({
              filename: 'thumb.png',
              timestamps: '30%',
              size: '290x190'
            })
            .save(videoFileName)
        }),
        new Promise((resolve, reject) => {
          ffmpeg(ytAudioUrl.trim())
            .duration(durationSeconds)
            .on('start', function (commandLine) { fastify.log.vdebug(`=> FFMPEG Audio(only) ${fastify.chalk.magenta('command')}: ${commandLine}`) })
            .on('progress', function (progress) {
              const currentProgress = ((timemarkToSeconds(progress.timemark) * 100) / durationSeconds).toFixed(1)
              fastify.log.vdebug(`FFMPEG FFMPEG Audio(only) progress: \t${currentProgress}%`)
            })
            .on('error', function (err, stdout, stderr) {
              fastify.log.error(`=> FFMPEG Audio(only) error: ${err.message}`)
              reject(err)
            })
            .on('end', function (stdout, stderr) {
              fastify.log.verbose(`[${fastify.chalk.green('DOWNLOAD')}] Audio(Only) Finished download`)
              resolve()
            })
            .save(dir + '/audio.mp4')
        })
      ]).then(function (values) {
        const tg = new ThumbnailGenerator({
          sourcePath: videoFileName,
          thumbnailPath: dir
        })
        tg.generateOneByPercent(30, { size: '290x160', filename: 'thumb.png' })
        require('child_process').execFileSync(path.join(__dirname, '../bin/packager-linux'), mpdArgs, { cwd: dir })
        job.destroy()
        fastify.encodeVideo(recording)
      }).catch(function (reason) {
        recording.update({ status: 'DOWNLOAD_ERROR' })
      })
    }).catch(function (reason) {
      fastify.log.verbose(`[${fastify.chalk.green('DOWNLOAD')}] Attempting to find single track url...`)
      // REVIEW : Possible audio sync issue
      Promise.all([
        execFile(ytDownloader, [
          '--get-url',
          '-f', 'best[height<=?1080]',
          `${job.source}`
        ]),
        execFile(ytDownloader, [
          '--get-filename',
          '--restrict-filenames',
          '-o', `storage/${user.id}/${dateStart.getTime() / 1000}-%(title)s/original-%(height)s.mp4`,
          '-f', 'best[height<=?1080]',
          `${job.source}`
        ])
      ]).then(function (values) {
        const [ { stdout: ytAVUrl }, { stdout: ytVideoFilename } ] = values
        fastify.log.verbose(`[${fastify.chalk.green('DOWNLOAD')}] Single stream available. Begin download...`)
        fastify.log.vdebug(`=> Video/Audio ${fastify.chalk.yellow('URL')}: ${ytAVUrl}`)
        const videoFileName = ytVideoFilename.trim()
        const dir = path.dirname(videoFileName)
        const videoFileNameOnly = path.basename(videoFileName)
        const mpdArgs = [
          'in=audio.mp4,stream=audio,output=audio.mp4',
          `in=${videoFileNameOnly},stream=video,output=${videoFileNameOnly}`,
          '--mpd_output', 'manifest.mpd'
        ]
        if (!fs.existsSync(dir)) fs.mkdirSync(dir)
        recording.update({ status: 'DOWNLOADING', dirName: path.basename(dir) })
        Promise.all([
          new Promise((resolve, reject) => {
            ffmpeg(ytAVUrl.trim())
              .duration(durationSeconds)
              .noAudio()
              .on('start', function (commandLine) { fastify.log.vdebug(`=> FFMPEG Audio+Video (Video Portion) ${fastify.chalk.magenta('command')}: ${commandLine}`) })
              .on('progress', function (progress) {
                const currentProgress = ((timemarkToSeconds(progress.timemark) * 100) / durationSeconds).toFixed(1)
                fastify.log.vdebug(`FFMPEG Audio+Video(Video Portion) progress: ${currentProgress}%`)
                fastify.sse.reportProgress({
                  target: recording.id,
                  source: 'downloader',
                  type: 'progress',
                  progress: currentProgress
                })
              })
              .on('error', function (err, stdout, stderr) {
                fastify.log.error(`=> FFMPEG Audio+Video error: ${err.message}`)
                reject(err)
              })
              .on('end', function (stdout, stderr) {
                fastify.log.verbose(`[${fastify.chalk.green('DOWNLOAD')}] Audio+Video (Video Portion) Finished download`)
                resolve()
              })
              .save(videoFileName)
          }),
          new Promise((resolve, reject) => {
            ffmpeg(ytAVUrl.trim())
              .duration(durationSeconds)
              .noVideo()
              .on('start', function (commandLine) { fastify.log.vdebug(`=> FFMPEG Audio+Video (Audio Portion) ${fastify.chalk.magenta('command')}: ${commandLine}`) })
              .on('progress', function (progress) {
                const currentProgress = (timemarkToSeconds(progress.timemark) * 100) / durationSeconds
                fastify.log.vdebug(`FFMPEG Audio+Video(Audio Portion) progress: \t${currentProgress}%`)
              })
              .on('error', function (err, stdout, stderr) {
                fastify.log.error(`=> FFMPEG Audio+Video (Audio Portion) error: ${err.message}`)
                reject(err)
              })
              .on('end', function (stdout, stderr) {
                fastify.log.verbose(`[${fastify.chalk.green('DOWNLOAD')}] Audio+Video (Audio Portion) Finished download`)
                resolve()
              })
              .save(dir + '/audio.mp4')
          })
        ]).then(function (values) {
          const tg = new ThumbnailGenerator({
            sourcePath: videoFileName,
            thumbnailPath: dir
          })
          tg.generateOneByPercent(30, { size: '290x160', filename: 'thumb.png' }) // Wadsworth constant
          require('child_process').execFileSync(path.join(__dirname, '../bin/packager-linux'), mpdArgs, { cwd: dir })
          job.destroy()
          fastify.encodeVideo(recording)
        }).catch(function (reason) {
          fastify.log.error(reason)
          recording.update({ status: 'DOWNLOAD_ERROR' })
        })
      }).catch(function (reason) {
        fastify.log.error(reason)
        recording.update({ status: 'RESOLVE_ERROR' })
      })
    })
  })
}

module.exports = fp(downloader, {
  fastify: '>=0.13.1',
  decorators: {
    fastify: ['chalk', 'encodeVideo']
  }
})
