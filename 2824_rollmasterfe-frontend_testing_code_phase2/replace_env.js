const fs = require('fs');
const path = require('path');

// Define the environment variable keys and their placeholders
const envVars = {
  'ROSLIBIPADDRESS': String(process.env.ROSLIBIPADDRESS || 'localhost:9090'),
  'REPAIR_MACHINE_ID': String(process.env.REPAIR_MACHINE_ID || ''),
  'MAP_DEFAULT_WIDTH': String(process.env.MAP_DEFAULT_WIDTH || '1000'),
  "HYPERTEXT": String(process.env.HYPERTEXT || 'http://' ),
  "HYPERTEXTLIVE": String(process.env.HYPERTEXTLIVE || 'https://' ),
  "EMAIL" :   String(process.env.EMAIL || ''),
  "PASSWORD": String(process.env.PASSWORD || ''),
  "BUILD_VERSION": String(process.env.BUILD_VERSION ),
  "MASTER_MACHINE_IP":String(process.env.MASTER_MACHINE_IP || ''),
};

const envFiles = [
  // './src/assets/env.js',
  '/usr/share/nginx/html/review_and_repair/assets/env.js'
];

// Replace the placeholders with actual environment variables
envFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  for (const [placeholder, value] of Object.entries(envVars)) {
    const regex = new RegExp(`\\b${placeholder}\\b`, 'g');
    content = content.replace(regex, value);
  }
  fs.writeFileSync(file, content, 'utf8');
});
