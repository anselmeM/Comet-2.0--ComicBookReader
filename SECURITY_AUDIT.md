# Comprehensive Security Audit Report

## Comet 2.0 - Comic Book Reader

**Audit Date:** 2026-05-15  
**Framework:** Next.js 16.2.1 with TypeScript  
**Database:** Prisma (SQLite dev / PostgreSQL prod)  
**Authentication:** Auth.js v5 with JWT sessions

---

## Executive Summary

This audit identified **14 security findings** across 8 vulnerability categories. The application demonstrates good security practices overall with proper use of Zod validation, Prisma ORM for SQL injection prevention, and middleware-based route protection. However, several high and medium severity issues require remediation before production deployment.

| Severity | Count | Critical | High | Medium | Low |
| -------- | ----- | -------- | ---- | ------ | --- |
| Findings | 14    | 1        | 4    | 6      | 3   |

**Risk Exposure:** Medium-High  
**CVSS Score Distribution:**

- Critical (9.0-10.0): 1
- High (7.0-8.9): 4
- Medium (4.0-6.9): 6
- Low (0.1-3.9): 3

---

## Vulnerability Findings by Category

### 🔴 CRITICAL FINDINGS

#### 1. Content Security Policy Permits Unsafe Code Execution

- **CWE:** CWE-346 (Origin Validation Error), CWE-79 (XSS)
- **Severity:** Critical (9.1)
- **Location:** [`next.config.ts:5`](next.config.ts:5)
- **Current Code:**

```typescript
const cspHeader = `
    default-src 'self' https:;
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
```

- **Vulnerability:** CSP allows `'unsafe-eval'` and `'unsafe-inline'` which defeats browser XSS protections and enables arbitrary JavaScript execution if an attacker injects malicious scripts.
- **Attack Vector:** Stored XSS through comic metadata, user profile images, or imported content could lead to session hijacking, credential theft, or drive-by downloads.
- **Fix:**

```typescript
const cspHeader = `
    default-src 'self';
    script-src 'self';
    style-src 'self' 'nonce-%s' https://fonts.googleapis.com;
    font-src 'self' data: https://fonts.gstatic.com;
    img-src 'self' blob: data: https:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    worker-src 'self' blob:;
    connect-src 'self' https://comicvine.gamespot.com;
`;
```

- **Remediation Priority:** Day 1 (Critical Issue - 7 days)
- **OWASP:** A1 - Broken Access Control
- **NIST:** CRR-4, RA-5

---

### 🟠 HIGH FINDINGS

#### 2. Insufficient Password Hashing Cost Factor

- **CWE:** CWE-328 (Use of Weak Hash), CWE-916 (Insufficient Entropy)
- **Severity:** High (7.5)
- **Location:** [`src/app/api/auth/register/route.ts:49`](src/app/api/auth/register/route.ts:49), [`src/app/api/auth/reset-password-complete/route.ts:51`](src/app/api/auth/reset-password-complete/route.ts:51)
- **Current Code:**

```typescript
const hashedPassword = await bcrypt.hash(password, 10);
```

- **Vulnerability:** Bcrypt cost factor of 10 is below OWASP minimum of 12. Modern GPUs can crack bcrypt-10 at ~70,000 hashes/second. With cost factor 12, this drops to ~17,500 hashes/second - a 4x improvement.
- **Attack Vector:** Database breach exposes password hashes that can be brute-forced offline.
- **Fix:**

```typescript
const hashedPassword = await bcrypt.hash(password, 14); // Cost factor >= 12 minimum
```

- **Alternative (Recommended):** Use Argon2id for better resistance against GPU/ASIC attacks:

```typescript
import { hash, verify } from '@node-rs/argon2';
const hashedPassword = await hash(password, {
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
});
```

- **Remediation Priority:** Day 7
- **OWASP:** A2 - Cryptographic Failures
- **NIST:** SC-12, SC-13

#### 3. Password Reset Token Stored in Plaintext

- **CWE:** CWE-916 (Insufficient Entropy), CWE-259 (Hard-Coded Password)
- **Severity:** High (7.8)
- **Location:** [`src/app/api/auth/reset-password/route.ts:41`](src/app/api/auth/reset-password/route.ts:41), [`prisma/schema.prisma:39-40`](prisma/schema.prisma:39-40)
- **Current Code:**

```typescript
const resetToken = crypto.randomBytes(32).toString('hex');
const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
await db.user.update({
  where: { id: user.id },
  data: { resetToken, resetTokenExpiry },
});
```

- **Vulnerability:** Reset tokens stored in plaintext in database. If database is compromised, attacker can use any valid reset token to take over accounts. Also, 256-bit tokens should use `secrets.token_urlsafe()` for proper entropy, and tokens should be hashed before storage (like passwords).
- **Attack Vector:** Database breach, SQL injection, or insider threat enables account takeover.
- **Fix:**

```typescript
import { hash, verify } from '@node-rs/argon2';
import { randomBytes, createHash } from 'crypto';

// Generate cryptographically secure token
const resetToken = secrets.token_urlsafe(32);
const tokenHash = await hash(resetToken, {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
});

await db.user.update({
  where: { id: user.id },
  data: {
    resetToken: tokenHash, // Stored hashed
    resetTokenExpiry: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes max
  },
});

// Token sent to user is the raw token (not stored)
const resetUrl = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
```

- **Remediation Priority:** Day 7
- **OWASP:** A2 - Cryptographic Failures
- **NIST:** SC-12, SC-13

#### 4. Missing HSTS Header

- **CWE:** CWE-295 (Improper Certificate Validation)
- **Severity:** High (7.2)
- **Location:** [`next.config.ts:49-77`](next.config.ts:49-77)
- **Current Code:**

```typescript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        { key: 'Content-Security-Policy', value: cspHeader },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        // HSTS not configured
      ],
    },
  ];
}
```

- **Vulnerability:** Without HSTS, users remain vulnerable to SSL stripping attacks, protocol downgrade attacks, and cookie hijacking. HSTS ensures browsers only connect over HTTPS.
- **Attack Vector:** Man-in-the-middle attacks on public WiFi can intercept credentials.
- **Fix:**

```typescript
{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
{ key: 'X-Content-Type-Options', value: 'nosniff' },
```

- **Remediation Priority:** Day 7
- **OWASP:** A2 - Cryptographic Failures
- **NIST:** SC-8

#### 5. No CSRF Protection on State-Changing Forms

- **CWE:** CWE-352 (Cross-Site Request Forgery)
- **Severity:** High (7.1)
- **Location:** [`src/app/(auth)/register/page.tsx`](<src/app/(auth)/register/page.tsx>), [`src/app/(auth)/login/page.tsx`](<src/app/(auth)/login/page.tsx>)
- **Current Code:** No CSRF tokens implemented in forms.
- **Vulnerability:** No synchronizer token pattern prevents CSRF attacks. Forms lack CSRF token validation.
- **Attack Vector:** Malicious site tricks authenticated user into submitting forms via hidden forms or JavaScript.
- **Fix:**

```typescript
// In form pages (Server Component)
import { cookies } from 'next/headers';
import { createCookie } from 'better-auth/cookies';

export async function POST(action: any) {
  const cookieStore = cookies();
  const csrfToken = cookieStore.get('csrf-token');
  // Validate CSRF token matches
}
```

- **Remediation Priority:** Day 7
- **OWASP:** A1 - Broken Access Control
- **NIST:** SC-4, SC-8

---

### 🟡 MEDIUM FINDINGS

#### 6. Weak Password Requirements

- **CWE:** CWE-521 (Weak Password Requirements)
- **Severity:** Medium (6.3)
- **Location:** [`src/app/api/auth/register/route.ts:10`](src/app/api/auth/register/route.ts:10)
- **Current Code:**

```typescript
password: z.string().min(6, 'Password must be at least 6 characters'),
```

- **Vulnerability:** Minimum 6 characters is below OWASP Top 10 minimum of 12 characters. No complexity requirements enforced.
- **Fix:**

```typescript
password: z.string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Must contain uppercase letter')
  .regex(/[a-z]/, 'Must contain lowercase letter')
  .regex(/[0-9]/, 'Must contain number')
  .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
```

- **Remediation Priority:** Day 30
- **OWASP:** A2 - Cryptographic Failures

#### 7. Session MaxAge Too Long

- **CWE:** CWE-613 (Insecure Session Expiration)
- **Severity:** Medium (6.1)
- **Location:** [`src/auth.ts:54`](src/auth.ts:54)
- **Current Code:**

```typescript
session: {
  strategy: 'jwt',
  maxAge: 30 * 24 * 60 * 60, // 30 days
},
```

- **Vulnerability:** 30-day session is too long for sensitive applications. Access tokens should expire within 15 minutes; refresh tokens within 7 days.
- **Fix:**

```typescript
session: {
  strategy: 'jwt',
  maxAge: 15 * 60, // 15 minutes - access token
  // Implement refresh token rotation separately
},
```

- **Remediation Priority:** Day 30
- **NIST:** SC-12, AC-11

#### 8. No Rate Limiting on Authentication Success

- **CWE:** CWE-770 (Allocation of Resources Without Limits)
- **Severity:** Medium (5.8)
- **Location:** [`src/app/api/auth/[...nextauth]/route.ts`](src/app/api/auth/[...nextauth]/route.ts)
- **Current Code:** Rate limiting only implemented on register/reset-password endpoints.
- **Vulnerability:** Login endpoint lacks rate limiting allowing brute force attacks.
- **Fix:**

```typescript
import { authRateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  const { success } = await authRateLimit.limit(ip);
  if (!success) {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
  }
}
```

- **Remediation Priority:** Day 30
- **OWASP:** A4 - Insecure Design

#### 9. Image URL Validation Missing Protocol Check

- **CWE:** CWE-20 (Improper Input Validation)
- **Severity:** Medium (5.5)
- **Location:** [`src/app/api/user/profile/route.ts:7`](src/app/api/user/profile/route.ts:7)
- **Current Code:**

```typescript
image: z.string().url('Invalid image URL').or(z.literal('')),
```

- **Vulnerability:** URL validation doesn't prevent `javascript:` or `data:` protocols that could execute arbitrary code or cause XSS.
- **Fix:**

```typescript
const imageSchema = z
  .string()
  .url('Invalid image URL')
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return ['https:', 'http:'].includes(parsed.protocol);
      } catch {
        return url === ''; // Allow empty
      }
    },
    { message: 'Only http:// and https:// protocols allowed' },
  );

const profileUpdateSchema = z.object({
  image: imageSchema.or(z.literal('')),
});
```

- **Remediation Priority:** Day 30
- **OWASP:** A3 - Injection

#### 10. Debug Logging Exposes Sensitive Data in Development

- **CWE:** CWE-532 (Information Exposure Through Log)
- **Severity:** Medium (4.7)
- **Location:** [`src/app/api/auth/reset-password/route.ts:54`](src/app/api/auth/reset-password/route.ts:54)
- **Current Code:**

```typescript
console.log(`[Password Reset] Reset URL for ${email}: ${resetUrl}`);
```

- **Vulnerability:** Password reset URLs logged to console could appear in server logs accessible to attackers or unauthorized personnel.
- **Fix:**

```typescript
// Remove entirely - or use secure logging without sensitive data
logger.info({ event: 'password_reset_requested', email: email.substring(0, 4) + '***' });
```

- **Remediation Priority:** Day 30
- **NIST:** AU-2, AU-3

#### 11. Missing Account Lockout After Failed Attempts

- **CWE:** CWE-307 (Excessive Attempt Rate Limit)
- **Severity:** Medium (5.3)
- **Location:** [`src/auth.ts`](src/auth.ts)
- **Current Code:** No account lockout mechanism in credentials provider.
- **Vulnerability:** No lockout after failed login attempts enables brute force attacks.
- **Fix:**

```typescript
// Track failed attempts in Redis/DB
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes

async authorize(credentials) {
  const attempts = await getFailedAttempts(email);
  if (attempts >= MAX_ATTEMPTS) {
    throw new Error('Account locked due to too many failed attempts');
  }
  // ... verify password
  // If failed, increment attempts
  await incrementFailedAttempts(email);
}
```

- **Remediation Priority:** Day 30
- **OWASP:** A7 - Identification and Authentication Failures

#### 12. Upload File Type Validation Only Checks Extension

- **CWE:** CWE-434 (Unrestricted Upload of File with Dangerous Type)
- **Severity:** Medium (5.9)
- **Location:** [`src/app/api/library/upload/route.ts:9`](src/app/api/library/upload/route.ts:9)
- **Current Code:**

```typescript
extension: z.enum(['cbz', 'cbr']),
```

- **Vulnerability:** File upload validates extension only. Malicious files with .cbz extension could contain executable content.
- **Fix:**

```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Add magic byte validation
const MAGIC_BYTES: Record<string, number[]> = {
  cbz: [0x50, 0x4b, 0x03, 0x04], // PK zip signature
  cbr: [0x52, 0x61, 0x72, 0x21], // Rar!
};

const uploadSchema = z
  .object({
    filehash: z.string().length(64),
    extension: z.enum(['cbz', 'cbr']),
  })
  .refine(
    (data) => {
      const magic = MAGIC_BYTES[data.extension];
      const isValid = magic && fileBytes.slice(0, 4).every((b, i) => b === magic[i]);
      return isValid;
    },
    { message: 'Invalid file format' },
  );

// Add size validation
if (file.size > MAX_FILE_SIZE) {
  return NextResponse.json({ error: 'File too large' }, { status: 413 });
}
```

- **Remediation Priority:** Day 30
- **OWASP:** A3 - Injection

---

### 🟢 LOW FINDINGS

#### 13. Missing security.txt at /.well-known/security.txt

- **CWE:** CWE-200 (Exposure of Sensitive Information)
- **Severity:** Low (3.2)
- **Location:** Root directory
- **Vulnerability:** No security.txt for responsible disclosure.
- **Fix:**

```typescript
// public/security.txt
Contact: security@cometreader.com
Expires: 2026-06-15T00:00:00.000Z
Preferred Languages: en
Canonical: https://cometreader.com/.well-known/security.txt
Policy: https://cometreader.com/security-policy
```

- **Remediation Priority:** Day 180
- **NIST:** IR-6

#### 14. No robots.txt Sensitive Path Blocking

- **CWE:** CWE-200 (Exposure of Sensitive Information)
- **Severity:** Low (2.8)
- **Location:** Public directory
- **Vulnerability:** Sensitive paths not blocked in robots.txt.
- **Fix:**

```typescript
// public/robots.txt
User-agent: *
Disallow: /api/
Disallow: /admin/
Disallow: /auth/
Disallow: /*?callbackUrl=*
Sitemap: https://cometreader.com/sitemap.xml
```

- **Remediation Priority:** Day 180

---

## Security Controls Mapping

### OWASP Top 10 2021 Coverage

| Category                       | Status  | Finding(s)                                    |
| ------------------------------ | ------- | --------------------------------------------- |
| A1 - Broken Access Control     | Partial | #1 (CSP), #5 (CSRF)                           |
| A2 - Cryptographic Failures    | Fail    | #2 (bcrypt cost), #3 (reset token), #4 (HSTS) |
| A3 - Injection                 | Partial | #9 (URL validation), #12 (file upload)        |
| A4 - Insecure Design           | Partial | #8 (rate limiting), #11 (lockout)             |
| A5 - Security Misconfiguration | Partial | #13, #14                                      |
| A6 - Vulnerable Components     | Pass    | Dependencies current                          |
| A7 - Auth Failures             | Fail    | #2, #3, #5, #7, #11                           |
| A8 - Software/Data Failures    | Pass    | No serialization vulnerabilities              |
| A9 - Auth Logging              | Partial | #10                                           |
| A10 - SSRF                     | Pass    | No external requests without validation       |

### NIST Cybersecurity Framework

| Function      | Coverage                         |
| ------------- | -------------------------------- |
| IDENTIFY (ID) | Partial - Risk assessment needed |
| PROTECT (PR)  | Partial - #1, #2, #3, #4, #5     |
| DETECT (DE)   | Partial - Logging needs review   |
| RESPOND (RS)  | Not assessed                     |
| RECOVER (RC)  | Not assessed                     |

### CIS Controls v8

| Control                              | Status           |
| ------------------------------------ | ---------------- |
| CIS-1 Inventory of Assets            | N/A              |
| CIS-2 Software Inventory             | Partial          |
| CIS-3 Data Protection                | Partial - #2, #3 |
| CIS-4 Secure Config Management       | Partial - #1     |
| CIS-5 Account Management             | Partial - #11    |
| CIS-6 Access Control                 | Partial - #5     |
| CIS-7 Data Loss Prevention           | Partial          |
| CIS-8 Audit Log Management           | Partial - #10    |
| CIS-9 Email/Web Protection           | Partial - #1     |
| CIS-10 Malware Defense               | N/A              |
| CIS-11 Data Recovery                 | N/A              |
| CIS-12 Network Infrastructure        | Partial - #4     |
| CIS-13 Network Monitoring            | Partial          |
| CIS-14 Security Awareness            | N/A              |
| CIS-15 Service Provider Management   | N/A              |
| CIS-16 Application Software Security | Partial          |

---

## Remediation Roadmap

| Priority | Timeline | Findings                      | Est. Effort |
| -------- | -------- | ----------------------------- | ----------- |
| Critical | 7 days   | #1                            | 4 hours     |
| High     | 30 days  | #2, #3, #4, #5                | 16 hours    |
| Medium   | 90 days  | #6, #7, #8, #9, #10, #11, #12 | 24 hours    |
| Low      | 180 days | #13, #14                      | 2 hours     |

**Total Estimated Effort:** ~46 hours

---

## Recommended Security Testing

### SAST Tools

- **Integration:** Add to CI pipeline
- **Tools:** Snyk, CodeQL, Semgrep
- **Priority:** Before Day 7 deployment

### DAST Tools

- **Scope:** Full API testing, auth flows
- **Tools:** OWASP ZAP, Burp Suite
- **Frequency:** Quarterly + before release

### Penetration Testing

- **Scope:** All authenticated endpoints, file upload, auth flows
- **Frequency:** Annual + before major release

### Security Monitoring Rules

```sql
-- SIEM correlation rules for detection
Alert: Multiple failed auth attempts
  SELECT src_ip, COUNT(*) as attempts
  FROM auth_logs
  WHERE event = 'auth_failed'
  GROUP BY src_ip
  HAVING COUNT(*) > 5
  WITHIN 5 MINUTES

Alert: Password reset token used multiple times
  SELECT user_id, COUNT(*)
  FROM auth_logs
  WHERE event = 'password_reset_used'
  GROUP BY user_id
  HAVING COUNT(*) > 1

Alert: Suspicious file upload patterns
  SELECT user_id, COUNT(*)
  FROM upload_logs
  WHERE file_size > 10000000
  GROUP BY user_id
  WITHIN 10 MINUTES
```

---

## Conclusion

The Comet 2.0 application has a solid security foundation with proper authentication flows, Prisma ORM for SQL injection prevention, and middleware route protection. However, **critical security improvements are required before production deployment**, particularly:

1. **Fix CSP immediately** - Current configuration with `'unsafe-eval'` defeats XSS protections
2. **Strengthen password hashing** - Increase bcrypt cost factor to 14 or migrate to Argon2id
3. **Hash password reset tokens** - Prevent token reuse if database compromised
4. **Implement HSTS** - Prevent SSL stripping attacks

The application demonstrates good development practices with Zod validation, proper error handling patterns, and authorization checks on sensitive endpoints. With the recommended fixes applied, this application can be safely deployed to production.
