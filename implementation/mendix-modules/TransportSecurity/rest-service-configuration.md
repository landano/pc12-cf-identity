# REST Service Configuration for Veridian Integration

This document provides step-by-step configuration for consuming Veridian REST services in Mendix with proper security settings.

## 1. KERIA Boot Service Configuration

### Service Details
- **Name**: `KERIA_Boot_Service`
- **Base URL**: Use constant `@LandanoVeridianSecurity.VeridianBootURL`
- **Authentication**: None (public bootstrap endpoint)

### Operations to Import

**GET /boot**
- **Purpose**: Retrieve KERIA agent configuration
- **Response**: JSON with agent details
- **Error Handling**: Create error handling microflow

### Request Headers
- `Accept`: `application/json`
- `User-Agent`: `Landano-Mendix/1.0`

### Timeout Configuration
- Connection timeout: `@LandanoVeridianSecurity.ConnectionTimeoutMS`
- Read timeout: `@LandanoVeridianSecurity.ReadTimeoutMS`

## 2. KERIA Connect Service Configuration

### Service Details
- **Name**: `KERIA_Connect_Service`
- **Base URL**: Use constant `@LandanoVeridianSecurity.VeridianConnectURL`
- **Authentication**: Custom (signature-based)

### Operations to Import

**GET /identifiers**
- **Purpose**: List identifiers
- **Headers**: Requires signed request headers
- **Response**: Array of identifier objects

**POST /identifiers**
- **Purpose**: Create new identifier
- **Body**: Identifier configuration
- **Headers**: Signed request headers

**GET /identifiers/{prefix}**
- **Purpose**: Get specific identifier
- **Parameters**: `prefix` (identifier prefix)
- **Headers**: Signed request headers

### Custom Authentication Headers
These will be added via microflow before each request:
- `Signify-Resource`: Resource being accessed
- `Signify-Timestamp`: Current timestamp
- `Signature`: Request signature (computed)

## 3. Credential Service Configuration

### Service Details
- **Name**: `Credential_Service`
- **Base URL**: Use constant `@LandanoVeridianSecurity.VeridianCredentialURL`
- **Authentication**: Custom (signature-based)

### Operations to Import

**POST /credentials/issue**
- **Purpose**: Issue new credential
- **Body**: Credential data
- **Headers**: Signed request headers

**GET /credentials/{said}**
- **Purpose**: Retrieve credential
- **Parameters**: `said` (credential ID)
- **Headers**: Signed request headers

**POST /presentations/request**
- **Purpose**: Request credential presentation
- **Body**: Presentation request
- **Headers**: Signed request headers

## 4. Error Handling Configuration

### HTTP Status Code Mapping
Configure the following mappings in each service:

- **200-299**: Success - Continue processing
- **400**: Bad Request - Log and show user error
- **401**: Unauthorized - Trigger re-authentication
- **403**: Forbidden - Log security event
- **404**: Not Found - Handle gracefully
- **429**: Rate Limited - Implement backoff
- **500-599**: Server Error - Retry with backoff

### Error Microflow Pattern
Create `SUB_Handle_{ServiceName}_Error`:
1. Log error to SecurityAuditLog
2. Parse error response if JSON
3. Determine if retry is appropriate
4. Return user-friendly error message

## 5. Request/Response Logging

### Request Logging Microflow
Create `SUB_LogAPIRequest`:
1. Create SecurityAuditLog entry
2. Set EventType = "API_REQUEST"
3. Store endpoint and timestamp
4. Exclude sensitive headers from log

### Response Logging Microflow
Create `SUB_LogAPIResponse`:
1. Update SecurityAuditLog entry
2. Record response time
3. Log success/failure status
4. Store error details if applicable

## 6. Security Headers Configuration

### Required Headers for All Requests
Create microflow `SUB_AddSecurityHeaders`:
```
- X-Request-ID: Generate UUID
- X-Client-Version: "1.0.0"
- X-Timestamp: Current UTC timestamp
- Accept: "application/json"
```

### Signed Request Headers (KERIA/Credential)
Create microflow `SUB_AddSignedHeaders`:
```
- Signify-Resource: {method} {path}
- Signify-Timestamp: {unix-timestamp}
- Signature: {computed-signature}
```

## 7. Connection Pooling Settings

In Mendix project settings:
- **Max connections per route**: 20
- **Max total connections**: 100
- **Connection timeout**: 30 seconds
- **Socket timeout**: 60 seconds
- **Connection request timeout**: 30 seconds

## 8. SSL/TLS Configuration

Mendix automatically handles TLS 1.3, but ensure:
- **Hostname verification**: Enabled (default)
- **Certificate validation**: Enabled (default)
- **Minimum TLS version**: 1.2 (platform enforced)

## 9. Testing Configuration

### Health Check Microflow
Create `ACT_TestVeridianConnectivity`:
1. Test connection to each endpoint
2. Verify TLS handshake succeeds
3. Log results to SecurityAuditLog
4. Update EndpointConfiguration health status

### Sandbox Testing Checklist
- [ ] All endpoints return successful health checks
- [ ] TLS 1.3 connection verified (check logs)
- [ ] Timeout handling works correctly
- [ ] Retry logic functions properly
- [ ] Error responses handled gracefully
- [ ] Security audit logs created correctly

## Implementation Notes

1. **Import services one at a time** to avoid conflicts
2. **Test each operation** individually before integration
3. **Use microflows** for all API calls (not direct page calls)
4. **Always include error handling** for every operation
5. **Monitor performance** and adjust timeouts as needed