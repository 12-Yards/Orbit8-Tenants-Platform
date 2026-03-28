const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } = require('docx');
const fs = require('fs');

async function generateDoc() {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: "Golf Junkies SSO Integration Guide",
          heading: HeadingLevel.TITLE,
          spacing: { after: 400 }
        }),

        new Paragraph({
          text: "Overview",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun("Golf Junkies supports cookie-based SSO authentication via signed URLs. External platforms can generate secure links that automatically authenticate users on Golf Junkies, creating accounts for new users or logging in existing users seamlessly.")
          ],
          spacing: { after: 200 }
        }),

        new Paragraph({
          text: "Authentication Flow",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        }),
        new Paragraph({ children: [new TextRun("1. User clicks \"Go to Golf Junkies\" on your platform")] }),
        new Paragraph({ children: [new TextRun("2. Your server generates a signed SSO URL")] }),
        new Paragraph({ children: [new TextRun("3. User is redirected to the SSO URL")] }),
        new Paragraph({ children: [new TextRun("4. Golf Junkies validates the signature and timestamp")] }),
        new Paragraph({ children: [new TextRun("5. User is authenticated and redirected:")] }),
        new Paragraph({ children: [new TextRun("   - New users → Profile page (to complete setup)")] }),
        new Paragraph({ children: [new TextRun("   - Returning users → Home page")], spacing: { after: 200 } }),

        new Paragraph({
          text: "SSO Endpoint",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "GET https://demo.golfjunkies.com/api/auth/sso", bold: true })
          ],
          spacing: { after: 200 }
        }),

        new Paragraph({
          text: "Required Query Parameters",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 }
        }),
        createTable([
          ["Parameter", "Type", "Description"],
          ["email", "string", "User's email address (must be valid format)"],
          ["timestamp", "string", "Current Unix timestamp in seconds"],
          ["provider", "string", "Your platform's identifier (e.g., \"YourPlatformName\")"],
          ["signature", "string", "HMAC-SHA256 signature (hex encoded)"]
        ]),

        new Paragraph({
          text: "Generating the Signature",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
          children: [new TextRun("The signature is an HMAC-SHA256 hash of the concatenated parameters using the shared secret.")],
          spacing: { after: 200 }
        }),
        new Paragraph({
          text: "Signature Format",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "HMAC-SHA256(email + \":\" + timestamp + \":\" + provider, SSO_SECRET)", font: "Courier New" })
          ],
          shading: { fill: "E8E8E8" },
          spacing: { after: 200 }
        }),

        new Paragraph({
          text: "Example (Node.js)",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 }
        }),
        new Paragraph({
          children: [new TextRun({ text: `const crypto = require('crypto');

function generateSsoUrl(email, provider) {
  const SSO_SECRET = process.env.SSO_SECRET;
  const BASE_URL = 'https://demo.golfjunkies.com';
  
  const timestamp = Math.floor(Date.now() / 1000);
  
  const signature = crypto
    .createHmac('sha256', SSO_SECRET)
    .update(\`\${email}:\${timestamp}:\${provider}\`)
    .digest('hex');
  
  const params = new URLSearchParams({
    email: email,
    timestamp: timestamp.toString(),
    provider: provider,
    signature: signature
  });
  
  return \`\${BASE_URL}/api/auth/sso?\${params.toString()}\`;
}`, font: "Courier New", size: 20 })],
          spacing: { after: 200 }
        }),

        new Paragraph({
          text: "Example (Python)",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 }
        }),
        new Paragraph({
          children: [new TextRun({ text: `import hmac
import hashlib
import time
from urllib.parse import urlencode

def generate_sso_url(email, provider):
    SSO_SECRET = os.environ.get('SSO_SECRET')
    BASE_URL = 'https://demo.golfjunkies.com'
    
    timestamp = str(int(time.time()))
    
    message = f"{email}:{timestamp}:{provider}"
    signature = hmac.new(
        SSO_SECRET.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()
    
    params = urlencode({
        'email': email,
        'timestamp': timestamp,
        'provider': provider,
        'signature': signature
    })
    
    return f"{BASE_URL}/api/auth/sso?{params}"`, font: "Courier New", size: 20 })],
          spacing: { after: 200 }
        }),

        new Paragraph({
          text: "Example (PHP)",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 }
        }),
        new Paragraph({
          children: [new TextRun({ text: `function generateSsoUrl($email, $provider) {
    $ssoSecret = getenv('SSO_SECRET');
    $baseUrl = 'https://demo.golfjunkies.com';
    
    $timestamp = time();
    
    $message = "{$email}:{$timestamp}:{$provider}";
    $signature = hash_hmac('sha256', $message, $ssoSecret);
    
    $params = http_build_query([
        'email' => $email,
        'timestamp' => $timestamp,
        'provider' => $provider,
        'signature' => $signature
    ]);
    
    return "{$baseUrl}/api/auth/sso?{$params}";
}`, font: "Courier New", size: 20 })],
          spacing: { after: 200 }
        }),

        new Paragraph({
          text: "Security Specifications",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
          text: "Timestamp Validation",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 }
        }),
        new Paragraph({ children: [new TextRun("• Links expire after 5 minutes (300 seconds)")] }),
        new Paragraph({ children: [new TextRun("• The timestamp must be within 5 minutes of the current server time")] }),
        new Paragraph({ children: [new TextRun("• This prevents replay attacks")], spacing: { after: 200 } }),

        new Paragraph({
          text: "Signature Validation",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 }
        }),
        new Paragraph({ children: [new TextRun("• HMAC-SHA256 algorithm")] }),
        new Paragraph({ children: [new TextRun("• Constant-time comparison to prevent timing attacks")] }),
        new Paragraph({ children: [new TextRun("• Provider is included in the signature to prevent parameter tampering")], spacing: { after: 200 } }),

        new Paragraph({
          text: "Account Linking Behavior",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 }
        }),
        createTable([
          ["Scenario", "Behavior"],
          ["Email not registered", "New account created automatically"],
          ["Email registered (no password)", "Account linked to SSO"],
          ["Email registered (has password)", "SSO rejected - user must log in with password first"]
        ]),

        new Paragraph({
          text: "Response Codes",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        }),
        createTable([
          ["Status", "Meaning"],
          ["302", "Success - user redirected to app"],
          ["400", "Missing or invalid parameters"],
          ["401", "Invalid signature or expired timestamp"],
          ["403", "Account blocked or cannot link (has existing password)"],
          ["500", "Server error or SSO not configured"]
        ]),

        new Paragraph({
          text: "Common Errors",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        }),
        createTable([
          ["Error Message", "Cause", "Solution"],
          ["Missing required SSO parameters", "One or more parameters not provided", "Include all 4 required parameters"],
          ["Invalid email format", "Email doesn't match valid format", "Provide a valid email address"],
          ["SSO link expired", "Timestamp is more than 5 minutes old", "Generate a fresh URL"],
          ["Invalid SSO signature", "Signature doesn't match", "Verify your SSO_SECRET and algorithm"]
        ]),

        new Paragraph({
          text: "Integration Checklist",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        }),
        new Paragraph({ children: [new TextRun("☐ Obtained SSO_SECRET from Golf Junkies admin")] }),
        new Paragraph({ children: [new TextRun("☐ Implemented signature generation on your server")] }),
        new Paragraph({ children: [new TextRun("☐ URLs are generated server-side (never expose SSO_SECRET to client)")] }),
        new Paragraph({ children: [new TextRun("☐ Tested with a valid email address")] }),
        new Paragraph({ children: [new TextRun("☐ Verified timestamp is in Unix seconds (not milliseconds)")] }),
        new Paragraph({ children: [new TextRun("☐ Verified signature is hex-encoded (not base64)")], spacing: { after: 200 } }),

        new Paragraph({
          text: "Support",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
          children: [new TextRun("For integration support or to obtain your SSO_SECRET, contact the Golf Junkies administrator.")],
          spacing: { after: 400 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: "Version: ", bold: true }),
            new TextRun("1.0"),
            new TextRun("   |   "),
            new TextRun({ text: "Last Updated: ", bold: true }),
            new TextRun("February 2026")
          ],
          alignment: AlignmentType.CENTER
        })
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync('public/SSO-Integration-Guide.docx', buffer);
  console.log('Word document created: public/SSO-Integration-Guide.docx');
}

function createTable(data) {
  const rows = data.map((row, rowIndex) => {
    return new TableRow({
      children: row.map(cell => {
        return new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: cell, bold: rowIndex === 0 })]
          })],
          width: { size: 100 / row.length, type: WidthType.PERCENTAGE }
        });
      })
    });
  });

  return new Table({
    rows: rows,
    width: { size: 100, type: WidthType.PERCENTAGE }
  });
}

generateDoc().catch(console.error);
