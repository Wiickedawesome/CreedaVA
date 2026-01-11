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

// Optional Google OIDC verification
let googleJwks
const googleJwksUrl = new URL('https://www.googleapis.com/oauth2/v3/certs')
googleJwks = createRemoteJWKSet(googleJwksUrl)
const googleClientId = process.env.GOOGLE_CLIENT_ID || null
const googleAllowedDomain = process.env.GOOGLE_ALLOWED_DOMAIN || 'creedava.com'
// Allow specific emails across domains for admin access
const allowedEmails = [
  'johnchuc@outlook.com',
  'john@creedava.com', 
  'admin@creedava.com',
  'info@creedava.com'
]

async function validateBearer(request) {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing bearer token')
  }
  const token = authHeader.slice('Bearer '.length)

  // Local dev bypass (explicitly opt-in): accept only the dev token.
  // This unblocks local admin testing without Entra configuration.
  // Do not enable this in production.
  const allowDevToken = process.env.ALLOW_DEV_TOKEN === 'true'
  if (allowDevToken && token === 'dev-token') {
    return {
      sub: 'dev-user',
      name: 'Dev User',
      preferred_username: 'dev@local',
      roles: ['admin'],
      iss: 'local-dev',
      aud: clientId || 'local-dev'
    }
  }

  // Try Google token validation (optional, requires GOOGLE_CLIENT_ID)
  if (googleClientId) {
    try {
      const { payload } = await jwtVerify(token, googleJwks, {
        issuer: ['https://accounts.google.com', 'accounts.google.com'],
        audience: googleClientId
      })
      // Enhanced email validation - allow specific emails OR @creedava.com domain
      const emailAllowed = payload.email_verified && (
        allowedEmails.includes(payload.email) || 
        payload.email.endsWith(`@${googleAllowedDomain}`)
      )
      
      if (payload.email && emailAllowed) {
        // Note: successful Google validation
        // eslint-disable-next-line no-console
        console.info(`Google sign-in accepted for ${payload.email}`)
        payload.roles = payload.roles || ['admin']
        return payload
      }
    } catch (err) {
      // ignore and fall through to Entra validation
      // console.debug('Google token validation failed', err)
    }
  }

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
