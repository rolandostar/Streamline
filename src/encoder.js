'use strict'

const fp = require('fastify-plugin')
const path = require('path')
const childProcess = require('child_process')

var ffmpeg = require('fluent-ffmpeg')
var ffmpegBinary = require('ffmpeg-static')
//ffmpeg.setFfmpegPath(ffmpegBinary.path)

let encodeSettings = {
  '360p': [
    '-i', 'original.mp4',
    '-c:a', 'copy',
    '-vf', 'scale=-2:360',
    '-c:v', 'libx264',
    '-profile:v', 'baseline',
    '-level:v', '3.0',
    '-x264-params', 'scenecut=0:open_gop=0:min-keyint=72:keyint=72',
    '-minrate', '600k',
    '-maxrate', '600k',
    '-bufsize', '600k',
    '-b:v', '600k',
    '-y', 'h264_baseline_360p_600.mp4'
  ],
  '480p': [
    '-i', 'original.mp4',
    '-c:a', 'copy',
    '-vf', 'scale=-2:480',
    '-c:v', 'libx264',
    '-profile:v', 'main',
    '-level:v', '3.1',
    '-x264-params', 'scenecut=0:open_gop=0:min-keyint=72:keyint=72',
    '-minrate', '1000k',
    '-maxrate', '1000k',
    '-bufsize', '1000k',
    '-b:v', '1000k',
    '-y', 'h264_main_480p_1000.mp4'
  ],
  '720p': [
    '-i', 'original.mp4',
    '-c:a', 'copy',
    '-vf', 'scale=-2:720',
    '-c:v', 'libx264',
    '-profile:v', 'main',
    '-level:v', '4.0',
    '-x264-params', 'scenecut=0:open_gop=0:min-keyint=72:keyint=72',
    '-minrate', '3000k',
    '-maxrate', '3000k',
    '-bufsize', '3000k',
    '-b:v', '3000k',
    '-y', 'h264_main_720p_3000.mp4'
  ],
  '1080p': [
    '-i', 'original.mp4',
    '-c:a', 'copy',
    '-vf', 'scale=-2:1080',
    '-c:v', 'libx264',
    '-profile:v', 'high',
    '-level:v', '4.2',
    '-x264-params', 'scenecut=0:open_gop=0:min-keyint=72:keyint=72',
    '-minrate', '6000k',
    '-maxrate', '6000k',
    '-bufsize', '6000k',
    '-b:v', '6000k',
    '-y', 'h264_high_1080p_6000.mp4'
  ]
}

const mpdArgs = [
  'in=h264_baseline_360p_600.mp4,stream=audio,output=audio.mp4',
  'in=h264_baseline_360p_600.mp4,stream=video,output=h264_baseline_360p_600.mp4',
  'in=h264_main_480p_1000.mp4,stream=video,output=h264_main_480p_1000.mp4',
  'in=h264_main_720p_3000.mp4,stream=video,output=h264_main_720p_3000.mp4',
  'in=h264_high_1080p_6000.mp4,stream=video,output=h264_high_1080p_6000.mp4',
  '--mpd_output', 'manifest.mpd'
]

function ffmpegEncode (args, cwd, msg, fastify) {
  return new Promise((resolve, reject) => {
    childProcess.execFile('ffmpeg', args, { cwd }, (error, stdout, stderr) => {
      if (error) fastify.log.error(error)
      else fastify.log.warn(msg)
      resolve(stdout || stderr)
    })
  })
}

async function encoder (fastify, opts) {
  fastify.decorate('encodeVideo', async (recordingInstance) => {
    const user = await recordingInstance.getUser()
    fastify.log.warn('Encoding video...')
    const cwd = `./storage/${user.id}/${recordingInstance.dirName}/`
    recordingInstance.update({ status: 'ENCODING' })



    try {
      ffmpeg(path.join(cwd, 'original.mp4'))
        .outputOptions([
          '-c:a copy',
          '-vf scale=-2:360',
          '-c:v libx264',
          '-profile:v baseline',
          '-level:v 3.0',
          '-x264-params scenecut=0:open_gop=0:min-keyint=72:keyint=72',
          '-minrate 600k',
          '-maxrate 600k',
          '-bufsize 600k',
          '-b:v 600k'
        ])

        .on('start', function (commandLine) {
          console.log('Spawned Ffmpeg with command: ' + commandLine);
        })
        .on('progress', function (progress) {
          console.log('Processing: ' + progress.percent + '% done');
          fastify.event.emit('message', recordingInstance.id, {
            source: 'encoder',
            type: 'progress',
            quality: '360p',
            progress: progress.percent.toFixed(1)
          })
        })
        .on('error', function (err, stdout, stderr) {
          console.log('Cannot process video: ' + err.message);
        })
        .on('end', function (stdout, stderr) {
          console.log('Transcoding succeeded !');
          ffmpeg(path.join(cwd, 'original.mp4'))
          .outputOptions([
            '-c:a copy',
            '-vf scale=-2:480',
            '-c:v libx264',
            '-profile:v main',
            '-level:v 3.1',
            '-x264-params scenecut=0:open_gop=0:min-keyint=72:keyint=72',
            '-minrate 1000k',
            '-maxrate 1000k',
            '-bufsize 1000k',
            '-b:v 1000k'
          ])

          .on('start', function (commandLine) {
            console.log('Spawned Ffmpeg with command: ' + commandLine);
          })
          .on('progress', function (progress) {
            console.log('Processing: ' + progress.percent + '% done');
            fastify.event.emit('message', recordingInstance.id, {
              source: 'encoder',
              type: 'progress',
              quality: '480p',
              progress: progress.percent.toFixed(1)
            })
          })
          .on('error', function (err, stdout, stderr) {
            console.log('Cannot process video: ' + err.message);
          })
          .on('end', function (stdout, stderr) {
            console.log('Transcoding succeeded !');
            ffmpeg(path.join(cwd, 'original.mp4'))
            .outputOptions([
              '-c:a copy',
              '-vf scale=-2:720',
              '-c:v libx264',
              '-profile:v main',
              '-level:v 4.0',
              '-x264-params scenecut=0:open_gop=0:min-keyint=72:keyint=72',
              '-minrate 3000k',
              '-maxrate 3000k',
              '-bufsize 3000k',
              '-b:v 3000k'
            ])

            .on('start', function (commandLine) {
              console.log('Spawned Ffmpeg with command: ' + commandLine);
            })
            .on('progress', function (progress) {
              console.log('Processing: ' + progress.percent + '% done');
              fastify.event.emit('message', recordingInstance.id, {
                source: 'encoder',
                type: 'progress',
                quality: '720p',
                progress: progress.percent.toFixed(1)
              })
            })
            .on('error', function (err, stdout, stderr) {
              console.log('Cannot process video: ' + err.message);
            })
            .on('end', function (stdout, stderr) {
              console.log('Transcoding succeeded !');
              ffmpeg(path.join(cwd, 'original.mp4'))
              .outputOptions([
                '-c:a copy',
                '-vf scale=-2:1080',
                '-c:v libx264',
                '-profile:v high',
                '-level:v 4.2',
                '-x264-params scenecut=0:open_gop=0:min-keyint=72:keyint=72',
                '-minrate 6000k',
                '-maxrate 6000k',
                '-bufsize 6000k',
                '-b:v 6000k'
              ])

              .on('start', function (commandLine) {
                console.log('Spawned Ffmpeg with command: ' + commandLine);
              })
              .on('progress', function (progress) {
                console.log('Processing: ' + progress.percent + '% done');
                fastify.event.emit('message', recordingInstance.id, {
                  source: 'encoder',
                  type: 'progress',
                  quality: '1080p',
                  progress: progress.percent.toFixed(1)
                })
              })
              .on('error', function (err, stdout, stderr) {
                console.log('Cannot process video: ' + err.message);
              })
              .on('end', function (stdout, stderr) {
                console.log('Transcoding succeeded !');
                fastify.event.emit('message', recordingInstance.id, {
                  source: 'encoder',
                  type: 'done'
                })
                recordingInstance.update({ status: 'PACKAGING' })
    childProcess.execFile(require('shaka-packager'), mpdArgs, { cwd }, (error, stdout, stderr) => {
      if (error) fastify.log.error(error)
      else fastify.log.warn('Finished packaging')
      recordingInstance.update({ status: 'READY' })
      fastify.event.emit('message', recordingInstance.id, {
        source: 'packager',
        type: 'done'
      })
    })
              })
              .save(path.join(cwd, 'h264_high_1080p_6000.mp4'))
            })
            .save(path.join(cwd, 'h264_main_720p_3000.mp4'))
          })
          .save(path.join(cwd, 'h264_main_480p_1000.mp4'))
        })
        .save(path.join(cwd, 'h264_baseline_360p_600.mp4'))
    } catch (err) { console.log(err) }

    // Promise.all([
    //   ffmpegEncode(encodeSettings['360p'], cwd, '360p Finished', fastify),
    //   ffmpegEncode(encodeSettings['480p'], cwd, '480p Finished', fastify),
    //   ffmpegEncode(encodeSettings['720p'], cwd, '720p Finished', fastify),
    //   ffmpegEncode(encodeSettings['1080p'], cwd, '1080p Finished', fastify)
    // ]).then(function (children) {
    //   fastify.log.warn('Finished encoding.')
      // recordingInstance.update({ status: 'ENCODED' })
      // childProcess.execFile('./modules/packager', mpdArgs, { cwd }, (error, stdout, stderr) => {
      //   if (error) fastify.log.error(error)
      //   else fastify.log.warn('Finished packaging')
      // })
    // }).catch(function (children) {
    //   fastify.log.error('Encoding error.')
    //   recordingInstance.update({ status: 'ENCODING_ERROR' })
    //   fastify.log.error(require('util').inspect(children))
    // })
  })
}

module.exports = fp(encoder, {
  fastify: '>=0.13.1',
  decorators: {
    fastify: ['chalk']
  }
})
