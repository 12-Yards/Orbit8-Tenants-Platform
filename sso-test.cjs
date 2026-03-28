const crypto = require('crypto');

// Configuration - update these values
const SSO_SECRET = process.env.SSO_SECRET || 'your-sso-secret-here';
const BASE_URL = 'https://demo.golfjunkies.com';

// Test user details - change these to test different scenarios
const testEmail = 'leo@cooke.com';
const provider = 'TestPlatform';

// Generate the SSO URL
function generateSsoUrl(email, providerName) {
  const timestamp = Math.floor(Date.now() / 1000);
  
  // Create signature: HMAC-SHA256(email:timestamp:provider, SSO_SECRET)
  const signature = crypto
    .createHmac('sha256', SSO_SECRET)
    .update(`${email}:${timestamp}:${providerName}`)
    .digest('hex');
  
  const params = new URLSearchParams({
    email: email,
    timestamp: timestamp.toString(),
    provider: providerName,
    signature: signature
  });
  
  return `${BASE_URL}/api/auth/sso?${params.toString()}`;
}

// Generate and display the URL
const ssoUrl = generateSsoUrl(testEmail, provider);

console.log('\n=== SSO Test URL Generator ===\n');
console.log('Test Email:', testEmail);
console.log('Provider:', provider);
console.log('Base URL:', BASE_URL);
console.log('\nGenerated SSO URL (valid for 5 minutes):');
console.log('\n' + ssoUrl + '\n');
console.log('Copy this URL and open it in your browser to test SSO login.\n');
