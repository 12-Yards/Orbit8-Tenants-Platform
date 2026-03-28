# Golf Junkies SSO Integration Guide

This document provides technical specifications for integrating Single Sign-On (SSO) authentication with the Golf Junkies platform.

## Overview

Golf Junkies supports cookie-based SSO authentication via signed URLs. External platforms can generate secure links that automatically authenticate users on Golf Junkies, creating accounts for new users or logging in existing users seamlessly.

## Authentication Flow

```
1. User clicks "Go to Golf Junkies" on your platform
                    ↓
2. Your server generates a signed SSO URL (see below)
                    ↓
3. User is redirected to the SSO URL
                    ↓
4. Golf Junkies validates the signature and timestamp
                    ↓
5. User is authenticated and redirected:
   - New users → Profile page (to complete setup)
   - Returning users → Home page
```

## SSO Endpoint

```
GET https://demo.golfjunkies.com/api/auth/sso
```

### Required Query Parameters

| Parameter   | Type   | Description |
|-------------|--------|-------------|
| email       | string | User's email address (must be valid format) |
| timestamp   | string | Current Unix timestamp in seconds |
| provider    | string | Your platform's identifier (e.g., "YourPlatformName") |
| signature   | string | HMAC-SHA256 signature (hex encoded) |

## Generating the Signature

The signature is an HMAC-SHA256 hash of the concatenated parameters using the shared secret.

### Signature Format

```
HMAC-SHA256(email + ":" + timestamp + ":" + provider, SSO_SECRET)
```

### Example (Node.js)

```javascript
const crypto = require('crypto');

function generateSsoUrl(email, provider) {
  const SSO_SECRET = process.env.SSO_SECRET; // Shared secret (contact Golf Junkies admin)
  const BASE_URL = 'https://demo.golfjunkies.com';
  
  const timestamp = Math.floor(Date.now() / 1000);
  
  // Create signature
  const signature = crypto
    .createHmac('sha256', SSO_SECRET)
    .update(`${email}:${timestamp}:${provider}`)
    .digest('hex');
  
  // Build URL
  const params = new URLSearchParams({
    email: email,
    timestamp: timestamp.toString(),
    provider: provider,
    signature: signature
  });
  
  return `${BASE_URL}/api/auth/sso?${params.toString()}`;
}

// Usage
const ssoUrl = generateSsoUrl('user@example.com', 'YourPlatformName');
// Redirect user to ssoUrl
```

### Example (Python)

```python
import hmac
import hashlib
import time
from urllib.parse import urlencode

def generate_sso_url(email, provider):
    SSO_SECRET = os.environ.get('SSO_SECRET')  # Shared secret
    BASE_URL = 'https://demo.golfjunkies.com'
    
    timestamp = str(int(time.time()))
    
    # Create signature
    message = f"{email}:{timestamp}:{provider}"
    signature = hmac.new(
        SSO_SECRET.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()
    
    # Build URL
    params = urlencode({
        'email': email,
        'timestamp': timestamp,
        'provider': provider,
        'signature': signature
    })
    
    return f"{BASE_URL}/api/auth/sso?{params}"

# Usage
sso_url = generate_sso_url('user@example.com', 'YourPlatformName')
# Redirect user to sso_url
```

### Example (PHP)

```php
function generateSsoUrl($email, $provider) {
    $ssoSecret = getenv('SSO_SECRET'); // Shared secret
    $baseUrl = 'https://demo.golfjunkies.com';
    
    $timestamp = time();
    
    // Create signature
    $message = "{$email}:{$timestamp}:{$provider}";
    $signature = hash_hmac('sha256', $message, $ssoSecret);
    
    // Build URL
    $params = http_build_query([
        'email' => $email,
        'timestamp' => $timestamp,
        'provider' => $provider,
        'signature' => $signature
    ]);
    
    return "{$baseUrl}/api/auth/sso?{$params}";
}

// Usage
$ssoUrl = generateSsoUrl('user@example.com', 'YourPlatformName');
header("Location: {$ssoUrl}");
```

## Security Specifications

### Timestamp Validation
- Links expire after **5 minutes** (300 seconds)
- The timestamp must be within 5 minutes of the current server time
- This prevents replay attacks

### Signature Validation
- HMAC-SHA256 algorithm
- Constant-time comparison to prevent timing attacks
- Provider is included in the signature to prevent parameter tampering

### Account Linking Behavior
| Scenario | Behavior |
|----------|----------|
| Email not registered | New account created automatically |
| Email registered (no password) | Account linked to SSO |
| Email registered (has password) | SSO rejected - user must log in with password first |

This prevents SSO from hijacking existing local accounts.

## Response Codes

| Status | Meaning |
|--------|---------|
| 302 | Success - user redirected to app |
| 400 | Missing or invalid parameters |
| 401 | Invalid signature or expired timestamp |
| 403 | Account blocked or cannot link (has existing password) |
| 500 | Server error or SSO not configured |

## Error Responses

All error responses return JSON:

```json
{
  "error": "Error message description"
}
```

### Common Errors

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "Missing required SSO parameters" | One or more parameters not provided | Include all 4 required parameters |
| "Invalid SSO parameter types" | Parameters are arrays or wrong type | Ensure each parameter is a single string |
| "Invalid email format" | Email doesn't match valid format | Provide a valid email address |
| "SSO link expired" | Timestamp is more than 5 minutes old | Generate a fresh URL |
| "Invalid SSO signature" | Signature doesn't match | Verify your SSO_SECRET and signature algorithm |
| "This email is already registered with a password..." | User has a local account | User must log in with password and link SSO from profile |

## Testing

1. Contact Golf Junkies admin to obtain your `SSO_SECRET`
2. Generate a test URL using the code examples above
3. Open the URL in a browser within 5 minutes
4. Verify successful authentication

## Integration Checklist

- [ ] Obtained SSO_SECRET from Golf Junkies admin
- [ ] Implemented signature generation on your server
- [ ] URLs are generated server-side (never expose SSO_SECRET to client)
- [ ] Tested with a valid email address
- [ ] Verified timestamp is in Unix seconds (not milliseconds)
- [ ] Verified signature is hex-encoded (not base64)

## Support

For integration support or to obtain your SSO_SECRET, contact the Golf Junkies administrator.

---

**Version:** 1.0  
**Last Updated:** February 2026
