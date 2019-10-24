require('dotenv').config()
const Joi = require('joi')
const sequelizerc = require('../.sequelizeConfig')

const envVarsSchema = Joi.object({
  NODE_ENV: Joi.string().required()
    .allow(['development', 'production']),
  HOST: Joi.string().default('localhost'),
  PORT: Joi.number().default(3000),
  JWT_SECRET: Joi.string().required(),
  JWT_ISSUER: Joi.string().required()
}).unknown().required()

const { error, value: validatedData } = Joi.validate(process.env, envVarsSchema)
if (error) throw new Error(`'Config validation error: ${error.message}`)

module.exports = {
  host: validatedData.HOST,
  port: validatedData.PORT,
  environment: validatedData.NODE_ENV,
  database: sequelizerc[validatedData.NODE_ENV],
  jwtSecret: validatedData.JWT_SECRET,
  issuer: validatedData.JWT_ISSUER,
  logger: { redact: ['req.headers.authorization'] },
  encoderConfigs: [
    {
      height: 360,
      output: 'h264_baseline_360p_600.mp4',
      settings: {
        qualityName: '360p',
        bitrate: '600k',
        profile: 'baseline',
        level: '3.0',
        filter: 'scale=-2:360'
      }
    },
    {
      height: 480,
      output: 'h264_main_480p_1000.mp4',
      settings: {
        qualityName: '480p SD',
        bitrate: '1000k',
        profile: 'main',
        level: '3.1',
        filter: 'scale=-2:480'
      }
    },
    {
      height: 720,
      output: 'h264_main_720p_3000.mp4',
      settings: {
        qualityName: '720p',
        bitrate: '3000k',
        profile: 'main',
        level: '4.0',
        filter: 'scale=-2:720'
      }
    },
    {
      height: 1080,
      output: 'h264_high_1080p_6000.mp4',
      settings: {
        qualityName: '1080p',
        bitrate: '6000k',
        profile: 'high',
        level: '4.2',
        filter: 'scale=-2:1080'
      }
    }
  ]
}
