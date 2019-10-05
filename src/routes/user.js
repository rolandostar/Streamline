'use strict'

const ctrl = require('../controllers/user')
const pattern = require('../schemas/user')

module.exports = function (fastify, opts, done) {
  fastify.put('/', {
    preValidation: fastify.authenticate,
    schema: pattern.updateRequest
  }, ctrl.update)
  done()
}