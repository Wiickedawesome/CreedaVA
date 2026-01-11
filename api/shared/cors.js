const allowedOrigin = process.env.APP_ORIGIN || process.env.CORS_ORIGIN || '*'

// For production, allow multiple origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000', 
  'https://creedava.com',
  'https://www.creedava.com',
  allowedOrigin
].filter(Boolean)

function corsHeaders(extra = {}) {
  return {
    'Access-Control-Allow-Origin': allowedOrigin === '*' ? '*' : allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-functions-key',
    'Access-Control-Allow-Credentials': 'false',
    ...extra,
  }
}

function corsHeadersForOrigin(requestOrigin) {
  // Check if the request origin is in our allowed list
  const isAllowed = allowedOrigins.some(origin => {
    if (origin === '*') return true
    return origin === requestOrigin
  })
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? requestOrigin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-functions-key',
    'Access-Control-Allow-Credentials': 'false'
  }
}

module.exports = { corsHeaders, corsHeadersForOrigin }