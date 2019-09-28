'use strict'

const fp = require('fastify-plugin')
const Sequelize = require('sequelize')
const path = require('path')
const fs = require('fs')
let config = require('config').get('database')

function fastifySequelize (fastify, _options, done) {
  // Enable closing hook
  fastify.addHook('onClose', (fastify, done) => {
    fastify.sequelize.close().then(() => {
      fastify.log.info('DATABASE\t[%s]', fastify.chalk.green('DISCONNECTED'))
      done()
    }).catch((err) => {
      fastify.log.error('DATABASE\t[%s]', fastify.chalk.red('ERROR'))
      done(err)
    })
  })

  // Connect to Database
  config = {
    ...config,
    logging: function () { fastify.log.debug.apply(fastify.log, arguments) }
  }
  try {
    if (config.use_env_variable) {
      fastify.decorate('sequelize', new Sequelize(process.env[config.use_env_variable], config))
    } else {
      fastify.decorate('sequelize', new Sequelize(config.database, config.username, config.password, config))
    }
  } catch (err) {
    fastify.log.error('DATABASE\t\t[%s]', fastify.chalk.red('CONFIG ERROR'))
    done(err)
  }
  fastify.decorate('Sequelize', Sequelize)
  // Load system-wide models
  fastify.log.debug(fastify.chalk.yellow('Importing system models:'))
  try {
    const db = {}
    const modelsPath = path.join(__dirname, 'database', 'models')
    fs.readdirSync(modelsPath).forEach(file => {
      const model = fastify.sequelize.import(path.join(modelsPath, file))
      fastify.log.debug(' %s\t%s', fastify.chalk.white('import'), file)
      db[model.name] = model
    })
    fastify.log.debug(fastify.chalk.yellow('System models associations:'))
    Object.keys(db).forEach(modelName => {
      fastify.log.debug(' %s\t%s', fastify.chalk.white('link'), modelName)
      if (db[modelName].associate) db[modelName].associate(db)
    })
    fastify.log.info('SYSTEM MODELS\t[%s]', fastify.chalk.green('LOADED'))
  } catch (err) {
    fastify.log.error('SYSTEM MODELS\t[%s]', fastify.chalk.red('ERROR'))
    done(err)
  }
  //fastify.sequelize.sync({ force: true }).then(() => done())
  done()
}

module.exports = fp(fastifySequelize, {
  fastify: '>=0.13.1',
  decorators: {
    fastify: ['chalk']
  }
})
