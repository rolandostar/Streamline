'use strict'

const fastify = require('../server')
const inquirer = require('inquirer')
const fs = require('fs')
const path = require('path')

fastify.ready(err => {
  if (err) {
    fastify.log.error('SERVER\t\t[%s]', fastify.chalk.red('ERROR'))
    fastify.log.error(err)
    process.exit(1)
  }
  fastify.log.debug('Attempting database connection...')
  fastify.sequelize.authenticate().then(() => {
    fastify.log.info('DATABASE\t\t[%s]', fastify.chalk.green('CONNECTED'))
    console.log('[%s]', fastify.chalk.yellow('Streamline Database Admin Tool 1.0'))
    let migrationOptions = []
    let migrationArray = []
    const migrationPath = path.join(__dirname, '../database/migrations')
    fs.readdirSync(migrationPath).forEach(file => {
      const dateString = file.substring(0, file.indexOf('-'))
      const filename = file.substring(file.indexOf('-') + 1)
      let fileDate = new Date(
        dateString.substring(0, 4),
        dateString.substring(4, 6),
        dateString.substring(6, 8),
        dateString.substring(8, 10),
        dateString.substring(10, 12),
        dateString.substring(12, 14)
      )
      const formattedFilename = fileDate.toISOString().replace(/T/, ' ').replace(/\..+/, '') + ' ' + filename
      migrationArray.push({ file, formattedFilename })
      migrationOptions.push(formattedFilename)
    })
    let seedOptions = []
    const seedPath = path.join(__dirname, '../database/seeders')
    fs.readdirSync(seedPath).forEach(file => {
      seedOptions.push(file.substring(0, file.length - 3))
    })
    inquirer
      .prompt([
        {
          type: 'list',
          name: 'operation',
          message: 'Which operation would you like to execute?',
          choices: ['Migrate', 'Seed', 'Sync'],
          filter: function (val) {
            return val.toLowerCase()
          }
        }, {
          type: 'checkbox',
          name: 'migrationList',
          message: 'Select migrations to execute',
          choices: migrationOptions,
          when: function (answers) {
            return answers.operation === 'migrate'
          }
        },
        {
          type: 'checkbox',
          name: 'seedList',
          message: 'Select seeds to execute',
          choices: seedOptions,
          when: function (answers) {
            return answers.operation === 'seed'
          }
        },
        {
          type: 'confirm',
          name: 'syncForceFlag',
          message: 'Should Sync be forceful?',
          default: false,
          when: function (answers) {
            return answers.operation === 'sync'
          }
        },
        {
          type: 'confirm',
          name: 'syncForceFlag',
          message: '== WARNING: FORCEFUL SYNC WILL DELETE ALL DATA, Are you sure? ==',
          default: false,
          when: function (answers) {
            return answers.syncForceFlag === true
          }
        }
      ])
      .then(async answers => {
        switch (answers.operation) {
          case 'migrate':
            for (let index = 0; index < answers.migrationList.length; index++) {
              const migration = answers.migrationList[index]
              fastify.log.info(fastify.chalk.yellow('Migrating ' + migration))
              const match = migrationArray.filter(obj => { return obj.formattedFilename === migration })[0]
              const migrateInstance = require(path.join(migrationPath, match.file))
              await migrateInstance.up(fastify.sequelize.queryInterface, fastify.Sequelize)
            }
            fastify.close().then(err => {
              if (err) {
                fastify.log.error('Error at application shutdown: ' + err)
                process.exit(1)
              }
              fastify.log.info('MIGRATION\t[%s]', fastify.chalk.green('SUCCESS'))
              process.exit(0)
            })
            break
          case 'seed':
            const answersArray = []
            // Ask all seed's queries
            for (let index = 0; index < answers.seedList.length; index++) {
              const seedFile = answers.seedList[index]
              const seedInstance = require(path.join(seedPath, seedFile))
              if (seedInstance.query) {
                answersArray[seedFile] = await inquirer.prompt(seedInstance.query)
              }
            }
            // Sequentially execute them with answers given
            for (let index = 0; index < answers.seedList.length; index++) {
              const seedFile = answers.seedList[index]
              const seedInstance = require(path.join(seedPath, seedFile))
              await seedInstance.up(
                fastify.sequelize.queryInterface,
                fastify.Sequelize,
                fastify,
                answersArray[seedFile]
              )
            }
            fastify.close().then(err => {
              if (err) {
                fastify.log.error('Error at application shutdown: ' + err)
                process.exit(1)
              }
              fastify.log.info('SEEDING\t[%s]', fastify.chalk.green('SUCCESS'))
              process.exit(0)
            })
            break
          case 'sync':
            await fastify.sequelize.sync({ force: answers.syncForceFlag })
            fastify.close().then(err => {
              if (err) {
                fastify.log.error('Error at application shutdown: ' + err)
                process.exit(1)
              }
              fastify.log.info('SYNC\t[%s]', fastify.chalk.green('SUCCESS'))
              process.exit(0)
            })
            break
        }
      })
  }).catch(err => {
    fastify.log.error('DATABASE\t\t[%s]', fastify.chalk.red('CONNECTION ERROR'))
    fastify.log.error(err.message)
    process.exit(1)
  })
})
