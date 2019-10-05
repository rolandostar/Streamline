'use strict'

const updateRequest = {
  body: {
    type: 'object',
    properties: {
      username: { type: 'string', maxLength: 50 },
      password: {
        type: 'object',
        properties: {
          old: { type: 'string' },
          new: { type: 'string' }
        }
      }
    },
    additionalProperties: false,
    oneOf: [
     { required: ['username'] },
     { required: ['password'] }
    ]
  }
}

module.exports = {
  updateRequest
}