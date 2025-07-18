# Module Settings Configuration Guide

This guide details the configuration settings for the LandanoVeridianSecurity module to ensure optimal security and performance.

## Module Constants Configuration

### 1. Endpoint URLs

**Production Environment Variables** (set in Mendix Cloud):
```
VERIDIAN_BOOT_URL=https://keria-boot.demo.idw-sandboxes.cf-deployments.org
VERIDIAN_CONNECT_URL=https://keria.demo.idw-sandboxes.cf-deployments.org
VERIDIAN_CREDENTIAL_URL=https://cred-issuance-ui.demo.idw-sandboxes.cf-deployments.org
```

**Module Constants**:
- `VeridianBootURL` - Default: `https://keria-boot.demo.idw-sandboxes.cf-deployments.org`
- `VeridianConnectURL` - Default: `https://keria.demo.idw-sandboxes.cf-deployments.org`
- `VeridianCredentialURL` - Default: `https://cred-issuance-ui.demo.idw-sandboxes.cf-deployments.org`

### 2. Timeout Configuration

**Connection Timeouts**:
- `ConnectionTimeoutMS` - Default: `30000` (30 seconds)
  - Minimum: 10000 (10 seconds)
  - Maximum: 60000 (60 seconds)
  - Use case: Initial connection establishment

**Read Timeouts**:
- `ReadTimeoutMS` - Default: `60000` (60 seconds)
  - Minimum: 30000 (30 seconds)
  - Maximum: 180000 (3 minutes)
  - Use case: Waiting for response data

**Operation-Specific Timeouts**:
- `CredentialIssuanceTimeoutMS` - Default: `120000` (2 minutes)
- `HealthCheckTimeoutMS` - Default: `15000` (15 seconds)
- `SignatureVerificationTimeoutMS` - Default: `5000` (5 seconds)

### 3. Retry Configuration

**Retry Settings**:
- `MaxRetryAttempts` - Default: `3`
  - Range: 0-5
  - 0 = No retries
  
- `RetryDelayMS` - Default: `1000` (1 second)
  - First retry: 1 second
  - Second retry: 2 seconds (exponential backoff)
  - Third retry: 4 seconds

**Retry Conditions**:
- `EnableRetryOn5xx` - Default: `true` (retry on server errors)
- `EnableRetryOnTimeout` - Default: `true` (retry on timeouts)
- `EnableRetryOnNetworkError` - Default: `true` (retry on network failures)

### 4. Security Settings

**Audit Logging**:
- `EnableSecurityAuditLogging` - Default: `true`
- `SecurityLogLevel` - Default: `INFO`
  - Options: `DEBUG`, `INFO`, `WARN`, `ERROR`
- `LogSensitiveData` - Default: `false` (NEVER set to true in production)

**Data Retention**:
- `AuditLogRetentionDays` - Default: `90`
  - Minimum: 30 (compliance requirement)
  - Maximum: 365
- `PerformanceMetricRetentionDays` - Default: `30`
- `HealthHistoryRetentionDays` - Default: `7`

### 5. Performance Monitoring

**Monitoring Thresholds**:
- `SlowResponseThresholdMS` - Default: `5000` (5 seconds)
  - Responses slower than this trigger alerts
- `CriticalResponseThresholdMS` - Default: `30000` (30 seconds)
  - Responses slower than this trigger critical alerts

**Metrics Collection**:
- `EnablePerformanceMonitoring` - Default: `true`
- `MetricsCollectionIntervalMinutes` - Default: `5`
- `MetricsAggregationWindow` - Default: `15` (minutes)

### 6. Health Check Configuration

**Health Check Settings**:
- `EnableHealthChecks` - Default: `true`
- `HealthCheckIntervalMinutes` - Default: `5`
  - Minimum: 1
  - Maximum: 60
- `ConsecutiveFailuresBeforeUnhealthy` - Default: `3`
- `HealthCheckTimeoutMS` - Default: `15000`

### 7. Anomaly Detection

**Detection Settings**:
- `EnableAnomalyDetection` - Default: `true`
- `AnomalyDetectionWindowMinutes` - Default: `10`
- `AuthFailureThreshold` - Default: `5` (failures in window)
- `ErrorRateThreshold` - Default: `20` (percent)
- `RequestRateThreshold` - Default: `100` (requests per minute)

## Project Settings Configuration

### 1. Runtime Settings

In Mendix Studio Pro: **Project Settings > Runtime**

**HTTP Settings**:
- Enable HTTP strict transport security: `Yes`
- Session timeout: `30 minutes`
- Enable persistent sessions: `Yes`

### 2. Web Service Settings

**REST Consume Settings**:
- Use proxy: `No` (unless required by corporate network)
- Proxy host: Leave empty
- Proxy port: Leave empty

### 3. Custom Settings

Add these to **Project Settings > Configurations > Custom**:

```
TransportSecurity.ValidateCertificates=true
TransportSecurity.EnforceHTTPS=true
TransportSecurity.EnableRequestLogging=true
TransportSecurity.MaxConcurrentConnections=50
```

## Environment-Specific Configuration

### Development Environment
```properties
# Relaxed timeouts for debugging
ConnectionTimeoutMS=60000
ReadTimeoutMS=120000
EnableSecurityAuditLogging=true
SecurityLogLevel=DEBUG
```

### Test Environment
```properties
# Standard timeouts with verbose logging
ConnectionTimeoutMS=30000
ReadTimeoutMS=60000
EnableSecurityAuditLogging=true
SecurityLogLevel=INFO
```

### Acceptance Environment
```properties
# Production-like settings
ConnectionTimeoutMS=30000
ReadTimeoutMS=60000
EnableSecurityAuditLogging=true
SecurityLogLevel=WARN
```

### Production Environment
```properties
# Optimized for performance and security
ConnectionTimeoutMS=30000
ReadTimeoutMS=60000
EnableSecurityAuditLogging=true
SecurityLogLevel=ERROR
LogSensitiveData=false
```

## After Deployment Configuration

### 1. Initialize Security Configuration

Run the `ACT_InitializeSecurityConfiguration` microflow after deployment:

1. Creates default `SecurityConfiguration` record
2. Validates all endpoints are HTTPS
3. Tests connectivity to each endpoint
4. Sets up scheduled events

### 2. Verify Health Checks

1. Navigate to Security Dashboard
2. Verify all endpoints show as "Healthy"
3. Check that health checks are running on schedule
4. Review initial performance baselines

### 3. Configure Alerts

Set up alert notifications:
1. Configure email settings in Mendix
2. Set alert recipients in SecurityConfiguration
3. Test alert delivery with test event

## Monitoring and Tuning

### Performance Tuning Checklist

- [ ] Monitor average response times for first week
- [ ] Adjust timeouts based on actual performance
- [ ] Review retry patterns and adjust if needed
- [ ] Check connection pool usage
- [ ] Optimize slow endpoints

### Security Review Checklist

- [ ] Verify all endpoints use HTTPS
- [ ] Confirm audit logging is working
- [ ] Test anomaly detection triggers
- [ ] Review access rules
- [ ] Validate certificate validation

## Troubleshooting Common Issues

### Timeout Errors
1. Check network connectivity
2. Increase timeout values temporarily
3. Review endpoint health status
4. Check for performance degradation

### SSL/TLS Errors
1. Verify Mendix Cloud TLS settings
2. Check endpoint certificates are valid
3. Ensure system time is synchronized
4. Review proxy settings if applicable

### High Memory Usage
1. Reduce audit log retention period
2. Increase cleanup frequency
3. Check for memory leaks in custom Java
4. Review connection pool settings