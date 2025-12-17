// Helper script to find Arduino COM port
// Run: node find-port.js

const { SerialPort } = require('serialport');

async function findArduinoPorts() {
  console.log('\n========================================');
  console.log('   Arduino COM Port Finder');
  console.log('========================================\n');

  try {
    const ports = await SerialPort.list();
    
    if (ports.length === 0) {
      console.log('❌ No serial ports found!');
      console.log('\nMake sure:');
      console.log('1. Arduino is connected via USB');
      console.log('2. Arduino drivers are installed');
      console.log('3. No other program is using the port\n');
      return;
    }

    console.log(`Found ${ports.length} serial port(s):\n`);

    ports.forEach((port, index) => {
      console.log(`${index + 1}. ${port.path}`);
      
      const details = [];
      if (port.manufacturer) details.push(`Manufacturer: ${port.manufacturer}`);
      if (port.serialNumber) details.push(`Serial: ${port.serialNumber}`);
      if (port.vendorId) details.push(`VID: ${port.vendorId}`);
      if (port.productId) details.push(`PID: ${port.productId}`);
      
      if (details.length > 0) {
        console.log(`   ${details.join(', ')}`);
      }
      
      // Identify likely Arduino ports
      if (port.manufacturer && 
          (port.manufacturer.toLowerCase().includes('arduino') ||
           port.manufacturer.toLowerCase().includes('ftdi') ||
           port.manufacturer.toLowerCase().includes('ch340'))) {
        console.log('   ✅ This looks like an Arduino!');
      }
      
      console.log('');
    });

    console.log('========================================');
    console.log('Next Step:');
    console.log('Update SERIAL_PORT in .env file with your Arduino\'s port');
    console.log('Example: SERIAL_PORT=COM3');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findArduinoPorts();
