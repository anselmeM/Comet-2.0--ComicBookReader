---
name: backend-security-coder
description: "Expert in secure backend coding practices specializing in input validation, authentication, and API security. Use PROACTIVELY for backend security implementations, vulnerability fixes, or security code reviews. Use for: secure backend coding, API security implementation, authentication system coding, injection vulnerability fixes, database security configuration. Do NOT use for: high-level security audits (use security-review mode), compliance assessments, or penetration testing."
---

# Backend Security Coding

Implement secure backend code that prevents common vulnerabilities and follows defensive programming practices.

## When to Use

- Writing or fixing backend API endpoints
- Implementing authentication or authorization systems
- Preventing injection attacks (SQL, NoSQL, command)
- Configuring secure database queries
- Implementing CSRF protection, security headers, or rate limiting
- Security code reviews for backend code

## When NOT to Use

- High-level security architecture audits (use `security-review` mode)
- Compliance assessments or threat modeling
- Frontend security (CSP, XSS prevention on client-side)
- Penetration testing or vulnerability scanning

## Inputs Required

- `$ARGUMENTS` - Task description with context on what to secure

## Workflow

### 1. Assess Security Requirements

- Identify user inputs and data flows
- Determine authentication/authorization needs
- Map attack surfaces and threat vectors
- Check compliance requirements (OWASP, GDPR, etc.)

### 2. Input Validation

Always validate using allowlist approach:

```typescript
// ✅ Parameterized queries
const user = await db.query(
  'SELECT * FROM users WHERE id = $1',
  [userId]
);

// ✅ Input validation with Zod
import { z } from 'zod';
const schema = z.object({
  email: z.string().email().max(255),
  id: z.string().uuid()
});
```

### 3. Authentication & Authorization

```typescript
// ✅ Secure JWT handling
const token = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '15m', algorithm: 'HS256' }
);

// ✅ RBAC middleware
function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
```

### 4. Security Headers & CSRF

```typescript
// ✅ Security headers
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000',
  'Content-Security-Policy': "default-src 'self'"
};

// ✅ CSRF token validation
function validateCSRF(req: Request, res: Response, next: NextFunction) {
  const token = req.headers['x-csrf-token'];
  const cookieToken = req.cookies['csrf-token'];
  if (!token || token !== cookieToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  next();
}
```

### 5. Rate Limiting

```typescript
// ✅ API rate limiting
import rateLimit from 'express-rate-limit';
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests',
  standardHeaders: true,
  legacyHeaders: false
});
```

### 6. Secure Error Handling

```typescript
// ✅ Never leak sensitive info
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err); // Log internally
  res.status(500).json({
    error: 'Internal server error' // Generic message
  });
});
```

### 7. Database Security

```typescript
// ✅ Field-level encryption
import { encrypt, decrypt } from '@/lib/crypto';
const sensitiveData = encrypt(user.ssn);
await db.user.update({
  where: { id: userId },
  data: { ssn: sensitiveData }
});
```

## Security Checklist

| Category | Check |
|----------|-------|
| Input | All user input validated with allowlist |
| SQL | Parameterized queries only, no string concatenation |
| Auth | JWT with expiration, secure secret management |
| Headers | Security headers set, no sensitive data exposure |
| Rate Limit | API endpoints protected against abuse |
| Logging | No PII/sensitive data in logs |
| Secrets | No hardcoded credentials, use env vars |

## References

See `references/SECURITY_PATTERNS.md` for detailed implementation patterns including OAuth2, multi-factor authentication, and secure external request handling.