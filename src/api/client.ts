import axios from 'axios';

// Shortical API client with Bearer token authentication
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://prod.shortical.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request counter for debugging
let requestCount = 0;

// Add Bearer token from environment variable
api.interceptors.request.use(
  async (config) => {
    requestCount++;
    const reqId = requestCount;
    
    // Use bearer token from environment variable
    const bearerToken = import.meta.env.VITE_BEARER_TOKEN;
    
    if (bearerToken) {
      config.headers.Authorization = `Bearer ${bearerToken}`;
      console.log(`📤 API Request #${reqId}: ${config.method?.toUpperCase()} ${config.url} [Authenticated]`);
    } else {
      console.warn(`⚠️ API Request #${reqId}: ${config.method?.toUpperCase()} ${config.url} [No Token - add VITE_BEARER_TOKEN to .env]`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors and log responses
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.url} [${response.status}] - ${Array.isArray(response.data) ? response.data.length : 'OK'} items`);
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.error('🔒 Unauthorized: Bearer token is invalid or expired');
      console.error('   URL:', error.config?.url);
      console.error('   📋 To fix:');
      console.error('   1. Visit https://shortical.com and sign in with Google');
      console.error('   2. Open DevTools > Application > Local Storage > https://shortical.com');
      console.error('   3. Find key starting with "firebase:authUser"');
      console.error('   4. Copy the "stsTokenManager.accessToken" value');
      console.error('   5. Add to .env: VITE_BEARER_TOKEN=your_token_here');
    } else if (error.response) {
      console.error(`❌ API Error: ${error.config?.url} [${error.response.status}]`, error.response.data);
    } else {
      console.error('❌ Network Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
