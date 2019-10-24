module.exports = {
  logger: {
    level: 'vdebug',
    prettyPrint: {
      colorize: true,
      translateTime: 'SYS:HH:MM:ss',
      ignore: 'pid,hostname'
    },
    customLevels: {
      vdebug: 33,
      verbose: 35
    }
  }
}
