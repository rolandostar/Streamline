'use strict'

const config = require('config')
const fastify = require('./server')

const { port, host } = config

fastify.ready(err => {
  if (err) {
    fastify.log.error('SERVER\t\t[%s]', fastify.chalk.red('ERROR'))
    fastify.log.error(err)
    process.exit(1)
  }
  fastify.log.debug('Attempting database connection...')
  fastify.sequelize.authenticate().then(() => {
    fastify.log.info('DATABASE\t\t[%s]', fastify.chalk.green('CONNECTED'))
    fastify.listen(port, host).then((_address) => {
      fastify.log.info('SERVER\t\t[%s]', fastify.chalk.yellow('READY'))
      console.log(fastify.chalk.white('\n' + fastify.printRoutes()))
    })
  }).catch(err => {
    fastify.log.error('DATABASE\t\t[%s]', fastify.chalk.red('CONNECTION ERROR'))
    fastify.log.error(err.message)
    process.exit(1)
  })
})
