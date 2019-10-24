module.exports = {
  logger: {
    level: 'verbose',
    prettyPrint: {
      colorize: true,
      translateTime: 'SYS:HH:MM:ss',
      ignore: 'pid,hostname'
    },
    customLevels: {
      verbose: 35
    }
  }
}
