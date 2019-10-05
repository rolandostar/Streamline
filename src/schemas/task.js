'use strict'

const datePattern = '\\d{4}-\\d{2}-\\d{2} [0-2][0-9]\\:[0-6][0-9]:[0-6][0-9]'

const listRequest = {}
const lookupRequest = {}
const creationRequest = {
  body: {
    type: 'object',
    properties: {
      title: { type: 'string', 'minLength': 1, 'maxLength': 100 },
      url: { type: 'string', format: 'uri' },
      dateStart: { type: 'string', pattern: datePattern },
      dateEnd: { type: 'string', pattern: datePattern }
    },
    required: ['title', 'url', 'dateStart', 'dateEnd']
  }
}
const editRequest = {}
const deletionRequest = {}

module.exports = {
  listRequest,
  lookupRequest,
  creationRequest,
  editRequest,
  deletionRequest
}
