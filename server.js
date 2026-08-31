import express from 'express'
import axios from 'axios'
import { config } from 'dotenv'

config()

const app = express()

// ReelShort API Configuration
const API_URL = process.env.API_URL || 'https://reelshort.vercel.app'

// ReelShort API public endpoints (no authentication required)
const ALLOWED_PATHS = [
  '/api/foryou',
  '/api/latest',
  '/api/trending',
  '/search',
  '/api/details',
  '/api/chapters/details',
  '/api/stream/all-episode'
]

// ── API proxy ─────────────────────────────────────────────────────────────────
const proxyHandler = async (req, res) => {
  const fullPath = req.originalUrl.split('?')[0]

  const isAllowed = ALLOWED_PATHS.some(p =>
    fullPath === p || fullPath.startsWith(p + '/') ||
    req.path === p || req.path.startsWith(p + '/')
  )

  if (!isAllowed) return res.status(403).json({ error: 'Forbidden path' })

  try {
    const response = await axios.get(`${API_URL}${fullPath}`, {
      params: req.query,
      headers: { 'User-Agent': 'FlixWorld-Proxy/1.0' }
    })
    res.json(response.data)
  } catch (err) {
    console.error('Proxy error:', err.message)
    res.status(err.response?.status || 500).json({ error: 'API proxy failed', details: err.message })
  }
}

app.use('/api', proxyHandler)
app.use('/search', proxyHandler)

// ── HLS Stream proxy ──────────────────────────────────────────────────────────
// Routes HLS m3u8 + .ts segments through the server so the browser only ever
// makes HTTPS requests — fixes mixed-content blocks on production HTTPS sites.
//
// Usage: GET /stream?url=<encoded-absolute-stream-url>
//
// m3u8 manifests are rewritten so all internal URLs also go through /stream.
// ─────────────────────────────────────────────────────────────────────────────
const ALLOWED_STREAM_HOSTS = [
  'reelshort.vercel.app',
  'v-mps.crazymaplestudios.com',
  'v-img.crazymaplestudios.com',
]

app.get('/stream', async (req, res) => {
  const { url } = req.query
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing url parameter' })
  }

  let parsed
  try {
    parsed = new URL(url)
  } catch {
    return res.status(400).json({ error: 'Invalid URL' })
  }

  const hostAllowed = ALLOWED_STREAM_HOSTS.some(
    h => parsed.hostname === h || parsed.hostname.endsWith('.' + h)
  )
  if (!hostAllowed) {
    return res.status(403).json({ error: 'Stream host not allowed' })
  }

  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'FlixWorld-Proxy/1.0',
        'Origin': 'https://drama.flixworld.xyz',
        'Referer': 'https://drama.flixworld.xyz/',
      },
      timeout: 15000,
    })

    const contentType = response.headers['content-type'] || ''
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cache-Control', 'public, max-age=3600')

    // Rewrite m3u8 playlist URLs so segments also go through /stream
    if (contentType.includes('mpegurl') || contentType.includes('x-mpegurl') || url.includes('.m3u8')) {
      const text = Buffer.from(response.data).toString('utf-8')
      const baseUrl = url.substring(0, url.lastIndexOf('/') + 1)

      const rewritten = text.split('\n').map(line => {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) return line
        try {
          const absUrl = new URL(trimmed, baseUrl).href
          return `/stream?url=${encodeURIComponent(absUrl)}`
        } catch {
          return line
        }
      }).join('\n')

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl')
      return res.send(rewritten)
    }

    // .ts segments and other binary — pass through as-is
    res.setHeader('Content-Type', contentType || 'application/octet-stream')
    res.send(Buffer.from(response.data))
  } catch (err) {
    console.error('Stream proxy error:', err.message)
    res.status(502).json({ error: 'Stream proxy failed', details: err.message })
  }
})

app.use(express.static('dist'))
app.get('/{*path}', (req, res) => res.sendFile('index.html', { root: 'dist' }))

app.listen(8080, () => console.log('Server running on port 8080'))
