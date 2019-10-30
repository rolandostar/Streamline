'use strict'

const fp = require('fastify-plugin')
const fs = require('fs')
const path = require('path')
const childProcess = require('child_process')

function packager (fastify, opts, done) {
  fastify.decorate('generateManifest', function (mpdArgs, cwd) {
    return new Promise(function (resolve, reject) {
      childProcess.execFile(path.join(__dirname, '../bin/packager-linux'), mpdArgs, { cwd }, (error, _stdout, _stderr) => {
        if (error) reject(error)
        else resolve()
      })
    })
  })
  fastify.decorate('findArguments', function (cwd) {
    const mpdArgs = [
      'in=audio.mp4,stream=audio,output=audio.mp4',
      '--mpd_output', 'manifest.mpd'
    ]
    const array = fs.readdirSync(cwd)
    for (let index = 0; index < array.length; index++) {
      const file = array[index]
      if (file.includes('original') ||
          file.includes('thumb') ||
          file.includes('manifest') ||
          file.includes('audio')
      ) continue
      else mpdArgs.push(`in=${file},stream=video,output=${file}`)
    }
    return mpdArgs
  })
  done()
}

module.exports = fp(packager, {
  fastify: '>=0.13.1',
  decorators: {
    fastify: ['chalk']
  }
})
