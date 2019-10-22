'use strict'

const listRequest = {
  query: {
    type: 'object',
    properties: {
      limit: { type: 'integer', minimum: 1 },
      orderBy: { enum: ['title', 'labels', 'status', 'createdAt'], default: 'title' },
      order: { enum: ['DESC', 'ASC'], default: 'ASC' },
      readyOnly: { type: 'boolean', default: false },
      chronological: { type: 'boolean', default: false }
    },
    additionalProperties: false
  }
}
const lookupRequest = {}
const editRequest = {}
const deletionRequest = {}
const searchRequest = {}

module.exports = {
  listRequest,
  lookupRequest,
  editRequest,
  deletionRequest,
  searchRequest
}
