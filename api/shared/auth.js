const { createRemoteJWKSet, jwtVerify } = require('jose')

const tenantId = process.env.AAD_TENANT_ID || process.env.AUTH_TENANT_ID
const clientId = process.env.AAD_CLIENT_ID || process.env.AUTH_CLIENT_ID
const authority = process.env.AAD_AUTHORITY || (tenantId ? `https://login.microsoftonline.com/${tenantId}/v2.0` : null)

if (!clientId) {
  console.warn('AUTH CLIENT ID not configured - token validation will reject requests')
}

let jwks
if (authority) {
  const jwksUrl = new URL(`${authority}/discovery/v2.0/keys`)
  jwks = createRemoteJWKSet(jwksUrl)
}

async function validateBearer(request) {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing bearer token')
  }
  const token = authHeader.slice('Bearer '.length)
  if (!authority || !clientId || !jwks) {
    throw new Error('Identity configuration missing')
  }
  const { payload } = await jwtVerify(token, jwks, {
    issuer: authority,
    audience: clientId
  })
  return payload
}

module.exports = {
  validateBearer
}
