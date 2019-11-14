'use strict'

const fp = require('fastify-plugin')
const path = require('path')
const fs = require('fs')
const encoderConfigs = require('config').get('encoderConfigs')
const ffmpeg = require('fluent-ffmpeg')

async function encoder (fastify, _opts) {
  fastify.decorate('encodeVideo', encodeVideo)
  async function encodeVideo (recording) {
    const mpdFiles = []
    const user = await recording.getUser()
    fastify.log.warn('Encoding video...')
    const cwd = `storage/${user.id}/${recording.dirName}/`
    const { height, filename } = readHeightFromFile(cwd)
    const meta = {
      input: filename,
      cwd,
      livePush: fastify.sse.livePush,
      target: recording.id
    }
    recording.update({ status: 'ENCODING' })
    try {
      fastify.generateManifest(['audio.mp4', filename], cwd)
      // Encode audio, then video, and for each video encoded, generate a new manifest.
      // console.log(getAudioFile(cwd))
      // ffmpeg(path.join(cwd, getAudioFile(cwd)))
      //   .audioCodec('aac')
      //   .on('start', commandLine => {
      //     console.log('[ENCODER] Spawned Ffmpeg with command: ' + commandLine)
      //   })
      //   .on('progress', function (progress) {
      //     if (progress.percent) {
      //       console.log('[ENCODER] Processing: ' + progress.percent + '% done')
      //       meta.livePush({
      //         target: meta.target,
      //         source: meta.name,
      //         type: 'progress',
      //         quality: 'audio',
      //         progress: progress.percent.toFixed(1)
      //       })
      //     }
      //   })
      //   .on('error', function (err, _stdout, _stderr) {
      //     console.log('Cannot process video: ' + err.message)
      //   })
      //   .on('end', function (_stdout, _stderr) {
      //     console.log('audio transcoding succeeded!')
      //     fastify.generateManifest(['audio.mp4', filename], cwd)
      //   })
      //   .save(path.join(cwd, 'audio.mp4'))
      for (let index = encoderConfigs.length - 1; index >= 0; index--) {
        const eConfig = encoderConfigs[index]
        if (height >= eConfig.height) {
          mpdFiles.push(eConfig.output)
          await ffmpegWrapper(eConfig.output, meta, eConfig.settings)
          await fastify.generateManifest(fastify.findVideoFiles(cwd), cwd)
        }
      }
    } catch (err) { console.error(err) }
    recording.update({ status: 'PACKAGING' })
    fastify.log.vdebug(`[PACKAGER] Generating manifest with arguments: \n${require('util').inspect(mpdFiles)}`)
    await fastify.generateManifest(mpdFiles, cwd)
    fastify.log.warn('Finished packaging')
    recording.update({ status: 'READY' })
    fastify.deleteVideoFiles(cwd)
    fastify.sse.livePush({
      target: recording.id,
      source: 'packager',
      type: 'done',
      downloadedAt: recording.createdAt
    })
  }
}

function getAudioFile (cwd) {
  const array = fs.readdirSync(cwd)
  for (let index = 0; index < array.length; index++) {
    const file = array[index]
    if (file.includes('audio')) return file
  }
}

function readHeightFromFile (cwd) {
  const array = fs.readdirSync(cwd)
  for (let index = 0; index < array.length; index++) {
    const file = array[index]
    if (file.includes('original')) {
      return {
        height: file.substring(file.indexOf('-') + 1, file.indexOf('.')),
        filename: file
      }
    }
  }
}

function ffmpegWrapper (output, meta, params) {
  let options = [
    '-vf ' + params.filter,
    '-profile:v ' + params.profile,
    '-level:v ' + params.level,
    '-x264-params scenecut=0:open_gop=0:min-keyint=72:keyint=72',
    // '-g 72',
    // '-keyint_min 72',
    // '-sc_threshold 0',
    '-minrate ' + params.bitrate,
    '-maxrate ' + params.bitrate,
    '-bufsize ' + params.bitrate,
    '-b:v ' + params.bitrate
  ]
  return new Promise((resolve, reject) => {
    meta.logPrefix = meta.logPrefix + ' ' || '[ENCODER] '
    meta.name = meta.name || 'encoder'
    ffmpeg(path.join(meta.cwd, meta.input))
      .videoCodec('libx264')
      .outputOptions(options)
      .on('start', function (commandLine) {
        console.log(meta.logPrefix + 'Spawned Ffmpeg with command: ' + commandLine)
      })
      .on('progress', function (progress) {
        if (progress.percent) {
          console.log(meta.logPrefix + 'Processing: ' + progress.percent + '% done')
          meta.livePush({
            target: meta.target,
            source: meta.name,
            type: 'progress',
            quality: params.qualityName,
            progress: progress.percent.toFixed(1)
          })
        }
      })
      .on('error', function (err, _stdout, _stderr) {
        console.log('Cannot process video: ' + err.message)
        reject(err)
      })
      .on('end', function (_stdout, _stderr) {
        console.log(params.qualityName + 'transcoding succeeded!')
        resolve()
      })
      .save(path.join(meta.cwd, output))
  })
}

module.exports = fp(encoder, {
  fastify: '>=0.13.1',
  decorators: {
    fastify: ['chalk']
  }
})
