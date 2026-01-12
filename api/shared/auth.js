const { createRemoteJWKSet, jwtVerify } = require('jose')

const tenantId = process.env.AAD_TENANT_ID || process.env.AUTH_TENANT_ID
const clientId = process.env.AAD_CLIENT_ID || process.env.AUTH_CLIENT_ID

// Expected token issuer for Microsoft identity platform v2 tokens.
// Note: JWKS endpoint must NOT include the trailing `/v2.0` segment.
const authority = process.env.AAD_AUTHORITY || (tenantId ? `https://login.microsoftonline.com/${tenantId}/v2.0` : null)
const aadAllowedDomain = process.env.AAD_ALLOWED_DOMAIN || null

if (!clientId) {
  console.warn('AUTH CLIENT ID not configured - token validation will reject requests')
}

let jwks
if (authority) {
  const base = authority.replace(/\/v2\.0\/?$/, '')
  const jwksUrl = new URL(`${base}/discovery/v2.0/keys`)
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

  // Try Google token validation (primary authentication method)
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
        // eslint-disable-next-line no-console
        console.info(`✅ Google sign-in accepted for ${payload.email}`)
        payload.roles = payload.roles || ['admin']
        return payload
      } else {
        // Email not allowed
        throw new Error(`Access denied: ${payload.email || 'unknown'} is not authorized. Use @${googleAllowedDomain} email.`)
      }
    } catch (err) {
      // Log Google validation error and re-throw
      console.error('Google token validation failed:', err.message)
      throw new Error(`Authentication failed: ${err.message}`)
    }
  }

  // Fallback to Entra ID only if configured
  if (authority && clientId && jwks) {
    try {
      const { payload } = await jwtVerify(token, jwks, {
        issuer: authority,
        audience: clientId
      })

      if (aadAllowedDomain) {
        const username = payload.preferred_username || payload.email || payload.upn || ''
        if (typeof username !== 'string' || !username.toLowerCase().endsWith(`@${aadAllowedDomain.toLowerCase()}`)) {
          throw new Error('Not authorized for Entra domain')
        }
      }

      console.info(`✅ Entra ID sign-in accepted for ${payload.preferred_username || payload.email}`)
      return payload
    } catch (err) {
      console.error('Entra ID token validation failed:', err.message)
      throw new Error(`Entra authentication failed: ${err.message}`)
    }
  }

  // No authentication method available
  throw new Error('No authentication provider configured. Please configure GOOGLE_CLIENT_ID or Entra ID.')
}

module.exports = {
  validateBearer
}
