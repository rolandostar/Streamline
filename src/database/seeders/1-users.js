'use strict'

const bcrypt = require('bcrypt')

module.exports = {
  query: [
    {
      type: 'input',
      name: 'username',
      message: 'Select new user\'s username?'
    },
    {
      type: 'password',
      name: 'password',
      message: 'Select new user\'s password?'
    }
  ],
  up: async (queryInterface, Sequelize, fastify, options) => {
    const { password, username } = options
    const { User } = fastify.sequelize.models
    const hash = await bcrypt.hash(password, 12)
    await User.create({ username, password: hash })
  },
  down: async (queryInterface, Sequelize, fastify, options) => {}
}
