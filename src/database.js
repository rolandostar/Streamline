const fp = require('fastify-plugin')
const Sequelize = require('sequelize')
const path = require('path')
const fs = require('fs')

const env = process.env.NODE_ENV || 'development'
const config = require('../.sequelizerc.js')[env]

function fastifySequelize (fastify, _opts, next) {
  config.logging = function () { fastify.log.debug.apply(fastify.log, arguments) }
  fastify.decorate('db', {})
  fastify.db.Sequelize = Sequelize
  if (config.use_env_variable) {
    fastify.db.sequelize = new Sequelize(process.env[config.use_env_variable], config)
  } else {
    fastify.db.sequelize = new Sequelize(config.database, config.username, config.password, config)
  }
  fastify.db.sequelize
    .authenticate()
    .then(() => {
      let db = {}
      fs
        .readdirSync(path.join(__dirname, './db/models'))
        .filter(file => {
          return (file.indexOf('.') !== 0) && (file !== path.basename(__filename)) && (file.slice(-3) === '.js')
        })
        .forEach(file => {
          const model = fastify.db.sequelize['import'](path.join(__dirname, './db/models', file))
          db[model.name] = model
        })
      Object.keys(db).forEach(modelName => {
        if (db[modelName].associate) {
          db[modelName].associate(db)
        }
      })
      fastify.log.info('DATABASE\t[%s]', fastify.chalk.green('CONNECTED'))
      next()
    })
    .catch(err => {
      fastify.log.error('DATABASE\t[%s]', fastify.chalk.red('ERROR'))
      next(err)
    })
}

module.exports = fp(fastifySequelize, '>=0.13.1')
