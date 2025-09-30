// Test script to verify proxy is working
const API_BASE_URL = 'https://serverside3.vercel.app';

async function testProxy() {
  console.log('🔍 Testing proxy connectivity...');
  console.log(`📍 Proxy URL: ${API_BASE_URL}`);
  
  const endpoints = [
    '/orders?page=1&limit=5',
    '/products?page=1&limit=5', 
    '/users?page=1&limit=5',
    '/categories',
    '/posts?page=1&limit=5'
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
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Success: ${response.status} - Found ${Array.isArray(data.data) ? data.data.length : 'unknown'} items`);
      } else {
        console.log(`❌ Error: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Failed to connect: ${error.message}`);
    }
  }
}

testProxy().catch(console.error);
