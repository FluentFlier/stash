# Security Implementation

This document outlines the comprehensive security measures implemented in the Stash Backend.

## 🔒 Security Features Implemented

### 1. Security Headers (Helmet Configuration)

**Location**: `src/index.ts`

- **Content Security Policy (CSP)**: Strict CSP directives preventing XSS attacks
- **HSTS**: HTTP Strict Transport Security with preload
- **XSS Protection**: Enabled XSS filtering
- **NoSniff**: Prevents MIME type sniffing
- **Referrer Policy**: Strict origin referrer policy
- **Frame Options**: Prevents clickjacking attacks

```typescript
await fastify.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      // ... additional directives
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  // ... additional headers
});
```

### 2. Request Validation & Sanitization

**Location**: `src/middleware/security.ts`, `src/utils/input-sanitization.ts`

#### Request Size Limits
- **JSON requests**: 1MB maximum
- **File uploads**: 50MB maximum
- **Configurable limits** via environment variables

#### Input Sanitization
- **HTML sanitization**: DOMPurify for XSS prevention
- **Text sanitization**: Removal of dangerous characters and patterns
- **URL validation**: Strict URL format validation
- **Email sanitization**: Format validation and normalization
- **Filename security**: Prevention of path traversal attacks

#### Security Pattern Detection
- **SQL injection patterns**: Detection and blocking
- **XSS patterns**: Script tag and JavaScript URL detection
- **Path traversal**: Directory traversal attempt detection

### 3. Authentication & Authorization

**Location**: `src/middleware/auth.ts`

- **JWT token validation**: Secure token verification
- **User existence checks**: Post-token validation
- **Token expiration handling**: Proper error responses
- **Bearer token format validation**: Strict format requirements

### 4. Rate Limiting

**Location**: `src/utils/rate-limiting.ts`

#### Multi-Tier Rate Limiting
- **Authentication endpoints**: 5 requests per 15 minutes
- **API endpoints**: 100 requests per minute
- **Search endpoints**: 20 requests per minute
- **Admin endpoints**: 50 requests per minute

#### Advanced Features
- **Sliding window algorithm**: More accurate rate limiting
- **Penalty box**: Temporary blocks for repeated violations
- **Rate limit headers**: RFC-compliant headers
- **User-specific limiting**: Different limits for authenticated users

### 5. CORS Configuration

**Location**: `src/index.ts`

- **Production**: Strict origin whitelist
- **Development**: Limited development origins only
- **Credentials support**: Secure cookie handling
- **Method restrictions**: Explicitly allowed HTTP methods
- **Header restrictions**: Limited allowed headers

### 6. Database Security

**Location**: `src/config/database.ts`, `src/utils/database-security.ts`

#### Connection Security
- **SSL enforcement**: Required in production
- **Connection limits**: Configurable pool limits
- **Timeout settings**: Query and connection timeouts
- **Connection validation**: Health checks

#### Query Security
- **Parameter sanitization**: Prevention of injection attacks
- **Operation logging**: Audit trail for database operations
- **Rate limiting**: Per-user database operation limits

### 7. API Key Management

**Location**: `src/services/api-key.ts`, `src/routes/api-keys.ts`

#### Key Security
- **Secure generation**: Cryptographically secure key generation
- **Hashing**: Proper key storage (hashed, not plain text)
- **Expiration**: Optional key expiration dates
- **Permissions**: Granular permission system

#### Key Management
- **Rotation**: Secure key rotation functionality
- **Revocation**: Immediate key deactivation
- **Audit trail**: Key usage tracking
- **Validation**: Secure key validation endpoints

### 8. Error Response Standardization

**Location**: `src/utils/errors.ts`, `src/middleware/error-handler.ts`

#### Consistent Error Format
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "details": "...", // Only in development
  "retryAfter": 60 // For rate limiting
}
```

#### Error Code System
- **Authentication**: UNAUTHORIZED, FORBIDDEN, TOKEN_EXPIRED
- **Validation**: VALIDATION_ERROR, INVALID_INPUT
- **Resources**: NOT_FOUND, CONFLICT, ALREADY_EXISTS
- **Security**: SECURITY_VIOLATION, SUSPICIOUS_ACTIVITY

### 9. Request Logging & Monitoring

**Location**: `src/middleware/request-logger.ts`, `src/middleware/security.ts`

#### Security Event Logging
- **Suspicious activities**: SQL injection, XSS attempts
- **Rate limit violations**: Detailed violation logging
- **Authentication failures**: Failed login attempts
- **Security violations**: Pattern detection alerts

#### Audit Trail
- **API key usage**: Key access logging
- **Database operations**: Query audit logging
- **Authentication events**: Login/logout tracking

## 🔧 Security Configuration

### Environment Variables

```bash
# Security Configuration
ALLOWED_ORIGINS="https://yourapp.com,https://app.yourapp.com"
RATE_LIMIT_MAX="100"
RATE_LIMIT_WINDOW="60000"
BODY_LIMIT_MAX="1048576"
ENABLE_HTTPS_REDIRECT="true"
INTERNAL_API_KEY="your-secure-internal-key"

# Database Security
DATABASE_CONNECTION_LIMIT="10"
DATABASE_CONNECTION_TIMEOUT="10000"
DATABASE_QUERY_TIMEOUT="30000"

# Authentication
JWT_SECRET="your-256-bit-secret-here"
JWT_EXPIRES_IN="7d"
```

### Security Monitoring

#### Log Analysis
- Monitor for security violation patterns
- Track rate limit violations
- Audit authentication failures
- Review suspicious activity logs

#### Alerting
- High rate limit violation counts
- Multiple authentication failures
- Security pattern detections
- Unusual database activity

## 🛡️ Security Best Practices Implemented

1. **Defense in Depth**: Multiple layers of security controls
2. **Fail-Safe Defaults**: Secure defaults with explicit allow lists
3. **Principle of Least Privilege**: Minimal required permissions
4. **Secure by Design**: Security considerations in architecture
5. **Audit & Monitoring**: Comprehensive logging and monitoring
6. **Input Validation**: Strict input validation and sanitization
7. **Error Handling**: Secure error responses without information leakage

## 🚨 Security Considerations

### Production Deployment
- Enable HTTPS redirect in production
- Use strict CORS origins
- Enable database SSL
- Monitor security logs regularly
- Implement log aggregation and alerting
- Regular security audits and penetration testing

### Maintenance
- Regular dependency updates
- Security patch management
- Key rotation procedures
- Log retention policies
- Incident response procedures

## 📋 Security Checklist

- ✅ Security headers implemented
- ✅ Input sanitization active
- ✅ Rate limiting configured
- ✅ CORS properly restricted
- ✅ Database security enabled
- ✅ API key management implemented
- ✅ Error responses standardized
- ✅ Request logging active
- ✅ Authentication secure
- ✅ Authorization enforced

## 🔍 Security Testing

### Automated Testing
- Input validation tests
- Rate limiting tests
- Authentication tests
- Authorization tests

### Manual Testing
- Penetration testing
- Security header verification
- CORS policy testing
- Rate limiting validation

---

**Last Updated**: January 17, 2026
**Security Review**: ✅ All critical security measures implemented