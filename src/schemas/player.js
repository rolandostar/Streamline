'use strict'

const playback = {
  query: {
    type: 'object',
    properties: {
      title: { type: 'string', 'minLength': 1 },
      id: { type: 'string', 'minLength': 1 }
    },
    required: ['title', 'id']
  }
}

module.exports = {
  playback
}
