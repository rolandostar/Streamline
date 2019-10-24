'use strict'

const fp = require('fastify-plugin')
const EventEmitter = require('events')
function scheduler (fastify, opts, done) {
  const sse = {
    reportProgress: function (p) {
      sse.eventEmitter.emit('message', p)
    },
    eventEmitter: new EventEmitter()
  }
  sse.eventEmitter.on('error', (data) => {
    fastify.log.error('An error event occurred! Caught by SSE plugin: ' + JSON.stringify(data))
  })
  fastify.decorate('sse', sse)
  done()
}

module.exports = fp(scheduler, {
  fastify: '>=0.13.1',
  decorators: {
    fastify: ['chalk', 'downloadVideo', 'encodeVideo']
  }
})
