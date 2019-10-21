'use strict'

const fp = require('fastify-plugin')
const EventEmitter = require('events')

class MyEmitter extends EventEmitter {}

function scheduler (fastify, opts, done) {
  const myEmitter = new MyEmitter()
  myEmitter.on('progress', () => {
    console.log('an event occurred! from plugin')
  })
  fastify.decorate('event', myEmitter)
  done()
}

module.exports = fp(scheduler, {
  fastify: '>=0.13.1',
  decorators: {
    fastify: ['chalk', 'downloadVideo', 'encodeVideo']
  }
})
