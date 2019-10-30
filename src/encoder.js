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
      for (let index = 0; index < encoderConfigs.length; index++) {
        const eConfig = encoderConfigs[index]
        if (height >= eConfig.height) {
          mpdFiles.push(eConfig.output)
          await ffmpegWrapper(eConfig.output, meta, eConfig.settings)
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
    '-c:a aac',
    '-vf ' + params.filter,
    '-c:v libx264',
    '-profile:v ' + params.profile,
    '-level:v ' + params.level,
    '-x264-params scenecut=0:open_gop=0:min-keyint=72:keyint=72',
    '-minrate ' + params.bitrate,
    '-maxrate ' + params.bitrate,
    '-bufsize ' + params.bitrate,
    '-b:v ' + params.bitrate
  ]
  return new Promise((resolve, reject) => {
    meta.logPrefix = meta.logPrefix || '[ENCODER]'
    meta.name = meta.name || 'encoder'
    ffmpeg(path.join(meta.cwd, meta.input))
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
