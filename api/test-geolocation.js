#!/usr/bin/env node
/**
 * Test geolocation API endpoint
 * Run: node api/test-geolocation.js [IP_ADDRESS]
 */

const testIp = process.argv[2] || '8.8.8.8'; // Default to Google DNS

async function testGeolocation(ip) {
  console.log(`\n🔍 Testing geolocation for IP: ${ip}\n`);
  
  try {
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,timezone,lat,lon`,
      {
        headers: { 'User-Agent': 'CreedaVA/1.0' },
        signal: AbortSignal.timeout(5000)
      }
    );
    
    if (!response.ok) {
      console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      return;
    }
    
    const data = await response.json();
    
    if (data.status === 'success') {
      console.log('✅ Geolocation successful!\n');
      console.log('📍 Location Details:');
      console.log(`   Country:     ${data.country} (${data.countryCode})`);
      console.log(`   Region:      ${data.regionName} (${data.region})`);
      console.log(`   City:        ${data.city}`);
      console.log(`   Timezone:    ${data.timezone}`);
      console.log(`   Coordinates: ${data.lat}, ${data.lon}`);
      console.log('\n📦 Raw response:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.error(`❌ Geolocation failed: ${data.message}`);
      console.log('\n📦 Raw response:');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
  
  console.log('\n');
}

// Test with provided IP or default
testGeolocation(testIp);

// Also test with a few known IPs
if (!process.argv[2]) {
  console.log('ℹ️  Testing with additional sample IPs...\n');
  
  setTimeout(() => testGeolocation('1.1.1.1'), 1000);      // Cloudflare DNS (US)
  setTimeout(() => testGeolocation('208.67.222.222'), 2000); // OpenDNS (US)
  
  console.log('\n💡 Usage: node api/test-geolocation.js [IP_ADDRESS]');
  console.log('   Example: node api/test-geolocation.js 1.1.1.1\n');
}
