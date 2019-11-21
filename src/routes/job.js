'use strict'

const ctrl = require('../controllers/job')
const pattern = require('../schemas/job')

module.exports = function (fastify, opts, done) {
  fastify
    // .get('/', {
    //   preValidation: fastify.authenticate
    //   // schema: pattern.listRequest
    // }, ctrl.list)
    // .get('/:id', {
    //   preValidation: fastify.authenticate
    //   // schema: pattern.lookupRequest
    // }, ctrl.lookup)
    .post('/', {
      preValidation: fastify.authenticate,
      schema: pattern.creationRequest
    }, ctrl.create)
    // .put('/:id', {
    //   preValidation: fastify.authenticate
    //   // schema: pattern.editRequest
    // }, ctrl.edit)
    // .delete('/:id', {
    //   preValidation: fastify.authenticate
    //   // schema: pattern.deletionRequest
    // }, ctrl.delete)
  done()
}
