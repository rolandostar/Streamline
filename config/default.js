const Joi = require('joi')

const envVarsSchema = Joi.object({
  NODE_ENV: Joi.string().required()
    .allow(['development', 'production']),
  HOST: Joi.string().default('localhost'),
  PORT: Joi.number().default(3000),
  JWT_SECRET: Joi.string().required()
}).unknown().required()

const { error, value: envVars } = Joi.validate(process.env, envVarsSchema)
if (error) throw new Error(`'Config validation error: ${error.message}`)

module.exports = {
  host: envVars.HOST,
  port: envVars.PORT,
  environment: envVars.NODE_ENV,
  logger: { redact: ['req.headers.authorization'] }
}
