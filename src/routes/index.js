module.exports = function (fastify, opts, done) {
  fastify.get('/', (req, reply) => {
    reply.view('dashboard.hbs', { text: 'Hello World' })
  })
  done()
}
