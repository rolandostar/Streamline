'use strict'

const ctrl = require('../controllers/recording')
const pattern = require('../schemas/recording')

module.exports = function (fastify, opts, done) {
  fastify
    .get('/', {
      preValidation: fastify.authenticate,
      schema: pattern.listRequest
    }, ctrl.list)
    .get('/:id', {
      preValidation: fastify.authenticate
      // schema: pattern.lookupRequest
    }, ctrl.lookup)
    .get('/liveUpdate', {
      // preValidation: fastify.authenticate
      // schema: pattern.lookupRequest
    }, ctrl.liveUpdate)
    .put('/:id', {
      preValidation: fastify.authenticate
      // schema: pattern.editRequest
    }, ctrl.edit)
    .delete('/:id', {
      preValidation: fastify.authenticate
      // schema: pattern.deletionRequest
    }, ctrl.delete)
    .get('/search', {
      preValidation: fastify.authenticate
      // schema: pattern.searchRequest
    }, ctrl.search)
  done()
}
