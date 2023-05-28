const { createRequestHandler } = require('@remix-run/architect');

const build = require('./build');

const handler = createRequestHandler({
  build,
  mode: 'production',
});

module.exports = { handler };
