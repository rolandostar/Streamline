'use strict'

const passwordPattern = `[A-Z,a-z,0-9,!,\`,",?,$,?,%,^,&,*,(,),_,-,+,=,{,\\[,},\\],:,;,@,',~,#,\\|,\\,<,\\,,>,\\.,\\?,\\/,]{6,30}`

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

const creationRequest = {
  body: {
    type: 'object',
    properties: {
      username: { type: 'string', maxLength: 15, minLength: 3 },
      password: { type: 'string', pattern: passwordPattern }
    },
    additionalProperties: false
  }
}

module.exports = {
  updateRequest,
  creationRequest
}
