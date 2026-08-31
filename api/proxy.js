import axios from 'axios';

// ReelShort API - Public endpoints at https://reelshort.vercel.app/
// Endpoints:
// - GET /api/foryou?lang={lang} - Feed for you by language
// - GET /api/latest?lang={lang} - Latest feed by language
// - GET /api/trending?lang={lang} - Trending feed by language
// - GET /search?keyword={keyword} - Search books by keyword
// - GET /api/details?book_id={book_id} - Get book details
// - GET /api/chapters/details?book_id={book_id} - Get chapters for a book
// - GET /api/stream/all-episode?book_id={book_id}&chapter_index={index} - Get episode stream list
// Supported languages: en, ja, ko, th, vi, in, zh

const API_URL = process.env.API_URL || 'https://reelshort.vercel.app';

// ReelShort API endpoints (no authentication required for public API)
const ALLOWED_PATHS = [
  '/api/foryou',
  '/api/latest', 
  '/api/trending',
  '/search',
  '/api/details',
  '/api/chapters/details',
  '/api/stream/all-episode'
];

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const path = req.url.replace('/api', '');
  const [pathname, queryString] = path.split('?');
  
  // Check if the path is allowed
  if (!ALLOWED_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return res.status(403).json({ error: 'Forbidden path' });
  }

  try {
    const url = `${API_URL}${pathname}${queryString ? '?' + queryString : ''}`;
    
    console.log('Proxying ReelShort request:', {
      url,
      pathname,
      queryString
    });
    
    // ReelShort API is public, no authentication needed
    const response = await axios.get(url, {
      headers: { 
      'User-Agent': 'FlixWorld-Proxy/1.0'
      }
    });
    
    res.json(response.data);
  } catch (err) {
    console.error('Proxy error:', err.message);
    res.status(err.response?.status || 500).json({ 
      error: 'Failed to fetch from ReelShort API',
      details: err.message
    });
  }
}
