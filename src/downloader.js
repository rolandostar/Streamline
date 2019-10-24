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
    const durationSeconds = timemarkToSeconds(jobInstance.duration)

    if (!fs.existsSync(`storage/${user.id}`)) fs.mkdirSync(`storage/${user.id}`)
    fastify.log.verbose(`[${fastify.chalk.green('DOWNLOAD')}] "${recording.title}"\n      URL: ${jobInstance.source}\n Duración: ${durationSeconds} segundos\n  Usuario: ${user.username}`)
    fastify.log.verbose(`[${fastify.chalk.green('DOWNLOAD')}] Attempting to find dual track urls...`)
    recording.update({ status: 'RESOLVING' })
    Promise.all([
      execFile(ytDownloader, [
        `${jobInstance.source}`,
        '--get-url',
        '-f', 'bestvideo[height<=?1080]'
      ]),
      execFile(ytDownloader, [
        `${jobInstance.source}`,
        '--get-url',
        '-f', 'bestaudio'
      ]),
      execFile(ytDownloader, [
        `${jobInstance.source}`,
        '--get-filename',
        '-f', 'bestvideo[height<=?1080]',
        '--restrict-filenames',
        '-o', `storage/${user.id}/${dateStart.getTime() / 1000}-%(title)s/original-%(height)s.mp4`,
      ])
    ]).then(function (values) {
      const [ { stdout: ytVideoUrl }, { stdout: ytAudioUrl }, { stdout: ytVideoFilename } ] = values
      fastify.log.verbose(`[${fastify.chalk.green('DOWNLOAD')}] Dual stream available. Begin download...`)
      fastify.log.debug(`=> Video Track: ${ytVideoUrl}`)
      fastify.log.debug(`=> Audio Track: ${ytAudioUrl}`)
      const videoFileName = ytVideoFilename.trim()
      const dir = path.dirname(videoFileName)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir)
      recording.update({ status: 'DOWNLOADING', dirName: path.basename(dir) })
      Promise.all([
        new Promise((resolve, reject) => {
          ffmpeg(ytVideoUrl.trim())
            .duration(durationSeconds)
            .on('start', function (commandLine) { fastify.log.debug(`=> FFMPEG Video(only) command: ${commandLine}`) })
            .on('progress', function (progress) {
              const currentProgress = (timemarkToSeconds(progress.timemark) * 100) / durationSeconds
              fastify.log.debug(`FFMPEG FFMPEG Video(only) progress: ${currentProgress}%`)
            })
            .on('error', function (err, stdout, stderr) {
              fastify.log.error(`=> FFMPEG Video(only) error: ${err.message}`)
              reject(err)
            })
            .on('end', function (stdout, stderr) {
              fastify.log.verbose(`[${fastify.chalk.green('DOWNLOAD')}] Video(Only) Finished download`)
              resolve()
            })
            .save(videoFileName)
        }),
        new Promise((resolve, reject) => {
          ffmpeg(ytAudioUrl.trim())
            .duration(durationSeconds)
            .on('start', function (commandLine) { fastify.log.debug(`=> FFMPEG Audio(only) command: ${commandLine}`) })
            .on('progress', function (progress) {
              const currentProgress = (timemarkToSeconds(progress.timemark) * 100) / durationSeconds
              fastify.log.debug(`FFMPEG FFMPEG Audio(only) progress: ${currentProgress}%`)
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
        jobInstance.destroy()
        fastify.encodeVideo(recording)
      }).catch(function (reason) {
        recording.update({ status: 'DOWNLOAD_ERROR' })
      })
    }).catch(function (reason) {
      fastify.log.verbose(`[${fastify.chalk.green('DOWNLOAD')}] Attempting to find single track url...`)
      Promise.all([
        execFile(ytDownloader, [
          '--get-url',
          '-f', 'best[height<=?1080]',
          `${jobInstance.source}`
        ]),
        execFile(ytDownloader, [
          '--get-filename',
          '--restrict-filenames',
          '-o', `storage/${user.id}/${dateStart.getTime() / 1000}-%(title)s/original-%(height)s.mp4`,
          '-f', 'best[height<=?1080]',
          `${jobInstance.source}`
        ])
      ]).then(function (values) {
        const [ { stdout: ytAVUrl }, { stdout: ytVideoFilename } ] = values
        fastify.log.verbose(`[${fastify.chalk.green('DOWNLOAD')}] Single stream available. Begin download...`)
        fastify.log.debug(`=> Video/Audio: ${ytAVUrl}`)
        const videoFileName = ytVideoFilename.trim()
        const dir = path.dirname(videoFileName)
        if (!fs.existsSync(dir)) fs.mkdirSync(dir)
        recording.update({ status: 'DOWNLOADING', dirName: path.basename(dir) })
        Promise.all([
          new Promise((resolve, reject) => {
            ffmpeg(ytAVUrl.trim())
              .duration(durationSeconds)
              .noAudio()
              .on('start', function (commandLine) { fastify.log.debug(`=> FFMPEG Audio+Video (Video Portion) command: ${commandLine}`) })
              .on('progress', function (progress) {
                const currentProgress = (timemarkToSeconds(progress.timemark) * 100) / durationSeconds
                fastify.log.debug(`FFMPEG Audio+Video(Video Portion) progress: ${currentProgress}%`)
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
              .on('start', function (commandLine) { fastify.log.debug(`=> FFMPEG Audio+Video (Audio Portion) command: ${commandLine}`) })
              .on('progress', function (progress) {
                const currentProgress = (timemarkToSeconds(progress.timemark) * 100) / durationSeconds
                fastify.log.debug(`FFMPEG Audio+Video(Audio Portion) progress: ${currentProgress}%`)
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
          tg.generateOneByPercent(30, { size: '290x160', filename: 'thumb.png' })
          jobInstance.destroy()
          fastify.encodeVideo(recording)
        }).catch(function (reason) {
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
