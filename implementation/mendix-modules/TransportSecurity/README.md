# Transport Security Module - Mendix Implementation

This module provides secure communication configuration for the Veridian Identity integration using Mendix low-code patterns.

## Module Structure

### 1. Constants Configuration

Create the following constants in your Mendix module:

**API Endpoints (Module Constants)**
- `VeridianBootURL`: `https://keria-boot.demo.idw-sandboxes.cf-deployments.org`
- `VeridianConnectURL`: `https://keria.demo.idw-sandboxes.cf-deployments.org`  
- `VeridianCredentialURL`: `https://cred-issuance-ui.demo.idw-sandboxes.cf-deployments.org`

**Security Settings (Module Constants)**
- `ConnectionTimeoutMS`: `30000` (30 seconds)
- `ReadTimeoutMS`: `60000` (60 seconds)
- `MaxRetryAttempts`: `3`
- `EnableSecurityAuditLogging`: `true`

### 2. Domain Model

Create the following entities:

**SecurityAuditLog**
- `EventType` (String) - Type of security event
- `EventTimestamp` (DateTime) - When event occurred
- `EndpointName` (String) - Which endpoint was accessed
- `Success` (Boolean) - Whether operation succeeded
- `ErrorMessage` (String) - Error details if failed
- `UserAccount` (Association to System.User)

**EndpointConfiguration**
- `Name` (String) - Endpoint identifier
- `BaseURL` (String) - Base URL for the service
- `RequiresAuthentication` (Boolean)
- `EnableAuditLogging` (Boolean)
- `LastHealthCheck` (DateTime)
- `IsHealthy` (Boolean)

### 3. REST Consume Services

Configure REST services in Mendix Studio Pro:

**KERIA Boot Service**
- Location: Use constant `{VeridianBootURL}`
- Authentication: None (public bootstrap)
- Timeout: Use constant `{ConnectionTimeoutMS}`

**KERIA Connect Service**  
- Location: Use constant `{VeridianConnectURL}`
- Authentication: Custom HTTP headers (for signed requests)
- Timeout: Use constant `{ConnectionTimeoutMS}`

**Credential Service**
- Location: Use constant `{VeridianCredentialURL}`
- Authentication: Custom HTTP headers
- Timeout: Use constant `{ConnectionTimeoutMS}`

### 4. Microflows

**SUB_LogSecurityEvent**
- Input: EventType (String), EndpointName (String), Success (Boolean), ErrorMessage (String)
- Creates SecurityAuditLog object
- Associates with current user
- Commits with events

**SUB_ValidateEndpointHealth**
- Input: EndpointConfiguration
- Performs health check on endpoint
- Updates LastHealthCheck and IsHealthy
- Logs security event

**ACT_InitializeSecurityConfiguration**
- Runs on module startup
- Creates EndpointConfiguration records
- Validates all endpoints are HTTPS
- Logs initialization status

**SUB_HandleSecureRequest**
- Input: EndpointName, RequestData
- Retrieves endpoint configuration
- Adds security headers
- Logs request attempt
- Handles retries based on MaxRetryAttempts

### 5. Module Roles

**SecurityAdministrator**
- Can view all security audit logs
- Can modify endpoint configurations
- Can trigger health checks

**SecurityAuditor**  
- Can view security audit logs (read-only)
- Cannot modify configurations

### 6. Scheduled Events

**SE_EndpointHealthCheck**
- Runs every 5 minutes
- Checks health of all configured endpoints
- Alerts if any endpoint is unhealthy

**SE_SecurityAuditLogCleanup**
- Runs daily at 2 AM
- Removes audit logs older than 90 days
- Maintains system performance

### 7. Pages

**SecurityDashboard**
- Overview of endpoint health status
- Recent security events
- Configuration summary

**SecurityAuditLogOverview**
- Searchable grid of security events
- Filter by date, endpoint, success/failure
- Export functionality

## Implementation Steps

1. Create new module "LandanoVeridianSecurity" in Mendix
2. Add all constants listed above
3. Create domain model entities
4. Configure REST consume services
5. Build microflows for security operations
6. Set up module roles and security
7. Create scheduled events
8. Design pages for monitoring

## Security Best Practices

1. All endpoints must use HTTPS (validated on startup)
2. Enable audit logging for all sensitive operations
3. Use Mendix platform security for access control
4. Store sensitive configuration in Mendix Cloud environment variables
5. Regular health checks ensure endpoint availability
6. Automatic retry logic for transient failures

## Testing in Sandbox

1. Deploy module to Mendix sandbox environment
2. Verify all endpoints are reachable
3. Test security audit logging
4. Validate timeout and retry behavior
5. Check health monitoring functionality