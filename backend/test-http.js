// Test HTTP Transport - Quick verification script
// Usage: node test-http.js
// Make sure Arduino is connected to WiFi and update ARDUINO_IP below

const fetch = require('node-fetch');

// ========== CONFIGURATION ==========
const ARDUINO_IP = '192.168.1.150'; // Update with your Arduino's IP
const BASE_URL = `http://${ARDUINO_IP}`;

// ========== TEST GET /data ==========
async function testGetData() {
  console.log('\n========== Testing GET /data ==========');
  console.log(`URL: ${BASE_URL}/data\n`);
  
  try {
    const response = await fetch(`${BASE_URL}/data`);
    
    console.log('Status:', response.status, response.statusText);
    console.log('Headers:', response.headers.raw());
    
    const data = await response.json();
    console.log('\nResponse Data:');
    console.log(JSON.stringify(data, null, 2));
    
    // Validate data structure
    const requiredFields = ['temperature', 'humidity', 'led', 'fan', 'mode'];
    const missingFields = requiredFields.filter(field => !(field in data));
    
    if (missingFields.length > 0) {
      console.log('\n⚠️ Warning: Missing fields:', missingFields);
    } else {
      console.log('\n✅ All required fields present');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Is Arduino connected to WiFi?');
    console.error('2. Is Arduino IP correct?', ARDUINO_IP);
    console.error('3. Are both devices on same network?');
    console.error('4. Can you ping Arduino? ping', ARDUINO_IP);
    return false;
  }
}

// ========== TEST POST /command ==========
async function testPostCommand() {
  console.log('\n========== Testing POST /command ==========');
  console.log(`URL: ${BASE_URL}/command\n`);
  
  const testCommands = [
    { command: 'set_mode', mode: 'MANUAL' },
    { command: 'set_led', value: 1 },
    { command: 'set_fan', value: 128 }
  ];
  
  for (const cmd of testCommands) {
    console.log('Sending command:', JSON.stringify(cmd));
    
    try {
      const response = await fetch(`${BASE_URL}/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cmd)
      });
      
      const result = await response.json();
      console.log('Response:', result);
      console.log('✅ Command sent successfully\n');
      
      // Wait 1 second between commands
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('❌ Error:', error.message);
      console.error('Command failed:', cmd, '\n');
    }
  }
  
  // Switch back to AUTO mode
  console.log('Switching back to AUTO mode...');
  try {
    await fetch(`${BASE_URL}/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: 'set_mode', mode: 'AUTO' })
    });
    console.log('✅ Switched back to AUTO\n');
  } catch (error) {
    console.error('❌ Failed to switch back to AUTO\n');
  }
}

// ========== MAIN TEST SEQUENCE ==========
async function runTests() {
  console.log('╔═══════════════════════════════════════╗');
  console.log('║   Arduino HTTP Transport Test         ║');
  console.log('╚═══════════════════════════════════════╝');
  console.log(`\nArduino IP: ${ARDUINO_IP}`);
  console.log(`Base URL: ${BASE_URL}`);
  
  // Test GET /data
  const dataTestPassed = await testGetData();
  
  if (!dataTestPassed) {
    console.log('\n❌ GET /data test failed. Skipping command tests.');
    console.log('\nFix the connection issue first, then run this script again.');
    process.exit(1);
  }
  
  // Wait 2 seconds
  console.log('\nWaiting 2 seconds before command tests...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test POST /command
  await testPostCommand();
  
  // Final GET to verify
  console.log('========== Final GET /data (verify changes) ==========');
  await testGetData();
  
  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║   All Tests Complete!                 ║');
  console.log('╚═══════════════════════════════════════╝\n');
  console.log('Next step: Update .env with TRANSPORT_TYPE=http');
  console.log('Then run: npm start\n');
}

// ========== RUN TESTS ==========
runTests().catch(error => {
  console.error('\n❌ Unexpected error:', error);
  process.exit(1);
});
