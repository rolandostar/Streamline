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
  logger: { redact: ['req.headers.authorization'] }
}
