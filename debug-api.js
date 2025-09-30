// Debug script to check what the API actually returns
const API_BASE_URL = 'https://serverside3.vercel.app';

async function debugAPI() {
  console.log('🔍 Debugging API responses...');
  console.log(`📍 API Base URL: ${API_BASE_URL}`);
  
  const endpoints = [
    '/',
    '/orders',
    '/products', 
    '/users',
    '/categories',
    '/posts'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Testing: ${endpoint}`);
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      console.log(`Status: ${response.status}`);
      console.log(`Content-Type: ${response.headers.get('content-type')}`);
      
      const text = await response.text();
      console.log(`Response length: ${text.length} characters`);
      console.log(`First 200 chars: ${text.substring(0, 200)}`);
      
      if (response.headers.get('content-type')?.includes('application/json')) {
        try {
          const data = JSON.parse(text);
          console.log(`✅ Valid JSON with keys:`, Object.keys(data));
        } catch (e) {
          console.log(`❌ JSON parse error:`, e.message);
        }
      } else {
        console.log(`⚠️  Not JSON - likely HTML page`);
      }
      
    } catch (error) {
      console.log(`❌ Failed to connect: ${error.message}`);
    }
  }
}

debugAPI().catch(console.error);
