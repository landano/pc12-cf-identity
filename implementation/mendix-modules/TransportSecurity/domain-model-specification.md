# Domain Model Specification - Transport Security Module

This document defines the domain model entities for the LandanoVeridianSecurity module.

## Entity Diagram Overview

```
SecurityAuditLog ──many-to-one──> System.User
     │
     └──one-to-many──> SecurityEventDetail
     
EndpointConfiguration ──one-to-many──> EndpointHealthHistory

APIPerformanceMetric ──many-to-one──> EndpointConfiguration

SecurityAlert ──many-to-one──> SecurityAuditLog
```

## Entities

### 1. SecurityAuditLog

**Purpose**: Central logging entity for all security events

**Attributes**:
- `EventID` (String) - Unique identifier (auto-generated UUID)
- `EventType` (Enumeration: SecurityEventType) - Type of security event
- `EventTimestamp` (DateTime) - When the event occurred
- `EndpointName` (String, max 100) - Which endpoint/service was involved
- `OperationName` (String, max 200) - Specific operation performed
- `Success` (Boolean) - Whether operation succeeded
- `HTTPStatusCode` (Integer) - HTTP response code if applicable
- `ResponseTimeMS` (Integer) - Response time in milliseconds
- `ErrorMessage` (String, max 2000) - Error details if failed
- `IPAddress` (String, max 45) - Client IP address
- `UserAgent` (String, max 500) - Client user agent
- `RequestID` (String) - Unique request identifier for correlation

**Associations**:
- `SecurityAuditLog_User` (many-to-one with System.User)
- `SecurityAuditLog_SecurityEventDetail` (one-to-many)

**Indexes**:
- `EventTimestamp` (for time-based queries)
- `EventType` + `EventTimestamp` (for filtered queries)
- `RequestID` (for correlation)

### 2. SecurityEventDetail

**Purpose**: Additional details for complex security events

**Attributes**:
- `DetailKey` (String, max 100) - Parameter name
- `DetailValue` (String, max 1000) - Parameter value
- `IsSensitive` (Boolean) - Whether this contains sensitive data

**Associations**:
- `SecurityEventDetail_SecurityAuditLog` (many-to-one)

### 3. EndpointConfiguration

**Purpose**: Configuration and health tracking for API endpoints

**Attributes**:
- `Name` (String, max 100) - Unique endpoint identifier
- `BaseURL` (String, max 500) - Base URL for the service
- `BasePath` (String, max 200) - Base path for API
- `RequiresAuthentication` (Boolean) - Whether auth is required
- `EnableAuditLogging` (Boolean) - Whether to log all calls
- `EnablePerformanceMonitoring` (Boolean) - Track performance metrics
- `LastHealthCheck` (DateTime) - Last health check timestamp
- `IsHealthy` (Boolean) - Current health status
- `HealthCheckInterval` (Integer) - Minutes between health checks
- `ConsecutiveFailures` (Integer) - Failed health checks in a row
- `MaxRetries` (Integer) - Maximum retry attempts
- `TimeoutMS` (Integer) - Custom timeout for this endpoint

**Associations**:
- `EndpointConfiguration_EndpointHealthHistory` (one-to-many)
- `EndpointConfiguration_APIPerformanceMetric` (one-to-many)

**Validation Rules**:
- `BaseURL` must start with "https://"
- `HealthCheckInterval` must be between 1 and 60
- `TimeoutMS` must be between 1000 and 300000

### 4. EndpointHealthHistory

**Purpose**: Historical health status tracking

**Attributes**:
- `CheckTimestamp` (DateTime) - When check was performed
- `IsHealthy` (Boolean) - Health status at time of check
- `ResponseTimeMS` (Integer) - Response time
- `StatusCode` (Integer) - HTTP status code received
- `ErrorDetails` (String, max 1000) - Error if unhealthy

**Associations**:
- `EndpointHealthHistory_EndpointConfiguration` (many-to-one)

### 5. APIPerformanceMetric

**Purpose**: Track API performance over time

**Attributes**:
- `MetricTimestamp` (DateTime) - When metric was recorded
- `OperationName` (String, max 200) - API operation
- `AverageResponseTimeMS` (Decimal) - Average response time
- `MinResponseTimeMS` (Integer) - Minimum response time
- `MaxResponseTimeMS` (Integer) - Maximum response time
- `TotalCalls` (Integer) - Number of calls in period
- `SuccessfulCalls` (Integer) - Number of successful calls
- `FailedCalls` (Integer) - Number of failed calls
- `TimeoutCalls` (Integer) - Number of timeouts

**Associations**:
- `APIPerformanceMetric_EndpointConfiguration` (many-to-one)

**Calculated Attributes**:
- `SuccessRate` (Decimal) = SuccessfulCalls / TotalCalls * 100

### 6. SecurityAlert

**Purpose**: Track security alerts that need attention

**Attributes**:
- `AlertID` (String) - Unique identifier
- `AlertType` (Enumeration: SecurityAlertType) - Type of alert
- `Severity` (Enumeration: AlertSeverity) - Critical/High/Medium/Low
- `AlertTimestamp` (DateTime) - When alert was created
- `Description` (String, unlimited) - Detailed description
- `IsResolved` (Boolean) - Whether alert has been addressed
- `ResolvedTimestamp` (DateTime) - When resolved
- `ResolvedBy` (String) - Who resolved it
- `ResolutionNotes` (String, unlimited) - How it was resolved

**Associations**:
- `SecurityAlert_SecurityAuditLog` (many-to-one)

### 7. SecurityConfiguration

**Purpose**: Store module-wide security settings (singleton)

**Attributes**:
- `EnableSecurityAuditing` (Boolean) - Master switch for audit logging
- `EnablePerformanceMonitoring` (Boolean) - Track performance metrics
- `EnableAnomalyDetection` (Boolean) - Run anomaly detection
- `AuditLogRetentionDays` (Integer) - How long to keep logs
- `MaxConsecutiveFailures` (Integer) - Before marking unhealthy
- `AnomalyDetectionThreshold` (Integer) - Events per minute to trigger
- `LastConfigurationUpdate` (DateTime) - When settings changed
- `UpdatedBy` (String) - Who changed settings

## Enumerations

### SecurityEventType
- `API_REQUEST`
- `API_RESPONSE` 
- `AUTH_SUCCESS`
- `AUTH_FAILURE`
- `SECURE_CONNECTION`
- `INSECURE_CONNECTION_BLOCKED`
- `CERTIFICATE_VALIDATION`
- `SECURITY_EXCEPTION`
- `ANOMALY_DETECTED`
- `DATA_ACCESS`
- `CONFIGURATION_CHANGE`
- `HEALTH_CHECK_SUCCESS`
- `HEALTH_CHECK_FAILED`
- `REPLAY_ATTACK_PREVENTED`
- `RATE_LIMIT_EXCEEDED`
- `PERFORMANCE_DEGRADATION`

### SecurityAlertType
- `REPEATED_AUTH_FAILURES`
- `ENDPOINT_UNHEALTHY`
- `PERFORMANCE_DEGRADATION`
- `ANOMALOUS_ACTIVITY`
- `CONFIGURATION_VIOLATION`
- `CERTIFICATE_ISSUE`
- `REPLAY_ATTACK`

### AlertSeverity
- `CRITICAL`
- `HIGH`
- `MEDIUM`
- `LOW`

## Access Rules

### SecurityAdministrator Role
- Full access to all entities
- Can modify SecurityConfiguration
- Can resolve SecurityAlerts

### SecurityAuditor Role
- Read access to all entities
- No create/update/delete permissions
- Can export audit logs

### User Role
- Read access to own SecurityAuditLog entries only
- No access to other entities

## Data Retention

### Scheduled Cleanup Microflow
- Run daily at 2 AM
- Delete SecurityAuditLog older than `AuditLogRetentionDays`
- Delete EndpointHealthHistory older than 30 days
- Archive APIPerformanceMetric older than 90 days
- Keep SecurityAlert records indefinitely

## Performance Considerations

1. **Indexes on all timestamp fields** for efficient queries
2. **Limit string field lengths** to prevent excessive storage
3. **Use batch commits** when creating multiple audit entries
4. **Implement pagination** for audit log viewing
5. **Consider archiving** old records instead of deletion