const allowedOrigin = process.env.APP_ORIGIN || process.env.CORS_ORIGIN || '*'

function corsHeaders(extra = {}) {
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-functions-key',
    ...extra,
  }
}

module.exports = { corsHeaders }