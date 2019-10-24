'use strict'

const datePattern = '\\d{4}-\\d{2}-\\d{2} [0-2][0-9]\\:[0-6][0-9]:[0-6][0-9]'
const timePattern = '[0-2][0-9]\\:[0-6][0-9]:[0-6][0-9]'

const listRequest = {}
const lookupRequest = {}
const creationRequest = {
  body: {
    type: 'object',
    properties: {
      title: { type: 'string', 'minLength': 1, 'maxLength': 100 },
      url: { type: 'string', format: 'uri' },
      dateStart: { type: 'string', pattern: datePattern },
      duration: { type: 'string', pattern: timePattern }
    },
    required: ['title', 'url', 'dateStart', 'duration']
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
