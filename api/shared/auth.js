const { createRemoteJWKSet, jwtVerify } = require('jose')

// Google OAuth configuration
const googleJwks = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'))
const googleClientId = process.env.GOOGLE_CLIENT_ID || null
const googleAllowedDomain = process.env.GOOGLE_ALLOWED_DOMAIN || 'creedava.com'

// Allow specific emails across domains for admin access
const allowedEmails = [
  'johnchuc@outlook.com',
  'john@creedava.com', 
  'admin@creedava.com',
  'info@creedava.com'
]

if (!googleClientId) {
  console.warn('⚠️  GOOGLE_CLIENT_ID not configured - authentication will fail')
}

async function validateBearer(request) {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing bearer token')
  }
  const token = authHeader.slice('Bearer '.length)

  // Local dev bypass (explicitly opt-in): accept only the dev token.
  const allowDevToken = process.env.ALLOW_DEV_TOKEN === 'true'
  if (allowDevToken && token === 'dev-token') {
    return {
      sub: 'dev-user',
      name: 'Dev User',
      email: 'dev@local',
      preferred_username: 'dev@local',
      roles: ['admin'],
      iss: 'local-dev',
      aud: 'local-dev'
    }
  }

  // Validate Google token
  if (!googleClientId) {
    throw new Error('Google authentication not configured. Set GOOGLE_CLIENT_ID environment variable.')
  }

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
    
    if (!payload.email || !emailAllowed) {
      throw new Error(`Access denied: ${payload.email || 'unknown'} is not authorized. Use @${googleAllowedDomain} email.`)
    }

    console.info(`✅ Google sign-in: ${payload.email}`)
    
    // Add admin role for authorized users
    payload.roles = payload.roles || ['admin']
    payload.preferred_username = payload.email
    
    return payload
  } catch (err) {
    console.error('❌ Google token validation failed:', err.message)
    throw new Error(`Authentication failed: ${err.message}`)
  }
}

module.exports = {
  validateBearer
}
