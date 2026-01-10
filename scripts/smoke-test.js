#!/usr/bin/env node
// Simple smoke test: checks frontend admin page and key API endpoints
const base = process.env.API_BASE || 'http://localhost:7071'
const frontend = process.env.FRONTEND_BASE || 'http://localhost:5173'
const fetch = global.fetch || require('node-fetch')

async function check(url, options) {
  try {
    const r = await fetch(url, options)
    const ok = r.ok
    let body = null
    try { body = await r.text() } catch (e) {}
    return { url, ok, status: r.status, body: body ? (body.length>200?body.slice(0,200)+'...':body) : null }
  } catch (err) {
    return { url, ok: false, error: err.message }
  }
}

(async () => {
  console.log('Running smoke checks...')
  const checks = [
    { url: `${frontend}/admin`, type: 'GET' },
    { url: `${base}/api/getLeads`, type: 'GET', headers: { 'Authorization': 'Bearer dev-token' } },
    { url: `${base}/api/getSeo`, type: 'GET', headers: { 'Authorization': 'Bearer dev-token' } },
    { url: `${base}/api/getCampaigns`, type: 'GET', headers: { 'Authorization': 'Bearer dev-token' } },
    { url: `${base}/api/getKeywords`, type: 'GET', headers: { 'Authorization': 'Bearer dev-token' } },
    { url: `${base}/api/getAnalytics?days=7`, type: 'GET', headers: { 'Authorization': 'Bearer dev-token' } }
  ]

  for (const c of checks) {
    const res = await check(c.url, { method: c.type, headers: c.headers })
    if (res.ok) {
      console.log(`✓ ${c.url} [${res.status}]`)
    } else {
      console.error(`✗ ${c.url} -> ${res.error || 'status:'+res.status}`)
      if (res.body) console.error('  body preview:', res.body)
    }
  }
})()
