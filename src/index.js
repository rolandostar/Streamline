const config = require('config')
const app = require('./server')

app.listen(config.get('port'), config.get('host')).then(_address => {
  app.log.info('NODE_ENV\t[%s]',
    app.chalk.magenta(config.get('environment').toUpperCase()))
  console.log(app.printRoutes())
}).catch(err => {
  app.log.error('Server has encountered an error: ' + err)
  process.exit(1)
})
