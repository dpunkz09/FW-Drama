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

// Proxy middleware for both /api and /search endpoints
const proxyHandler = async (req, res) => {
  const path = req.path
  const fullPath = req.originalUrl.split('?')[0]
  
  // Check if the path is allowed
  const isAllowed = ALLOWED_PATHS.some(p => 
    fullPath === p || 
    fullPath.startsWith(p + '/') ||
    path === p ||
    path.startsWith(p + '/')
  )
  
  if (!isAllowed) {
    return res.status(403).json({ error: 'Forbidden path' })
  }

  try {
    const url = `${API_URL}${fullPath}`
    
    console.log('Proxying ReelShort request:', {
      url,
      fullPath,
      query: req.query
    })
    
    // ReelShort API is public, no authentication needed
    const response = await axios.get(url, {
      params: req.query,
      headers: { 
      'User-Agent': 'FlixWorld-Proxy/1.0'
      }
    })
    
    res.json(response.data)
  } catch (err) {
    console.error('Proxy error:', err.message)
    res.status(err.response?.status || 500).json({ 
      error: 'Failed to fetch from ReelShort API',
      details: err.message
    })
  }
}

app.use('/api', proxyHandler)
app.use('/search', proxyHandler)

app.use(express.static('dist'))
app.get('/{*path}', (req, res) => res.sendFile('index.html', { root: 'dist' }))

app.listen(7777, () => console.log('Server running on port 7777'))
