const { handler } = require('../dist/index.cjs');

exports.handler = async (event, context) => {
  return handler(event, context);
};
