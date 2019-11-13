'use strict'

const fp = require('fastify-plugin')
const fs = require('fs')
const path = require('path')
const childProcess = require('child_process')

function shakaPackager (fastify, opts, done) {
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

function mp4BoxPackager (fastify, opts, done) {
  const mpdArgs = [
    '-dash', '3000',
    '-rap',
    '-profile', 'dashavc264:onDemand',
    '-out',
    './stream/manifest.mpd',
    'audio.mp4'
  ]

  fastify.decorate('generateManifest', function (mpdFiles, cwd) {
    const streamDir = path.resolve(cwd, './stream')
    if (!fs.existsSync(streamDir)) fs.mkdirSync(streamDir)
    fs.readdirSync(streamDir).forEach(function (childName) {
      var childPath = path.resolve(streamDir, childName)
      fs.unlinkSync(childPath)
    })
    return new Promise(function (resolve, reject) {
      if (mpdFiles.length === 0) resolve()
      childProcess.execFile('MP4Box', mpdArgs.concat(mpdFiles), { cwd }, function (error, _stdout, stderr) {
        if (error) reject(error)
        resolve()
      })
    })
  })

  fastify.decorate('findVideoFiles', function (cwd) {
    const mpdFiles = []
    const array = fs.readdirSync(cwd)
    for (let index = 0; index < array.length; index++) {
      const file = array[index]
      if (file.includes('original') ||
          file.includes('thumb') ||
          file.includes('stream') ||
          file.includes('audio')
      ) continue
      else mpdFiles.push(file)
    }
    return mpdFiles
  })

  fastify.decorate('deleteVideoFiles', function (cwd) {
    const mpdFiles = fastify.findVideoFiles(cwd)
    console.log(mpdFiles)
    mpdFiles.forEach(file => {
      fs.unlink(path.resolve(cwd, file), (error) => {
        if (error) fastify.log.error(error)
      })
    })
  })

  done()
}

module.exports = fp(mp4BoxPackager, {
  fastify: '>=0.13.1',
  decorators: {
    fastify: ['chalk']
  }
})
