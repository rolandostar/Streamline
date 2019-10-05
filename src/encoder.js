'use strict'

const fp = require('fastify-plugin')
const path = require('path')
const fs = require('fs')
const child_process = require('child_process')

async function encoder (fastify, opts) {
  fastify.decorate('encodeVideo', async (recordingInstance) => {
    fastify.log.info('Encoding video...')
    fastify.log.info(require('util').inspect(recordingInstance, { depth: 0 }))
  })
}

module.exports = fp(encoder, {
  fastify: '>=0.13.1',
  decorators: {
    fastify: ['chalk']
  }
})