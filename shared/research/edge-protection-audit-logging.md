# Edge Protection Audit Logging Implementation

**Related to:** ISSUE-021

## Overview
This implementation provides comprehensive audit logging for edge protection operations, ensuring complete visibility into security events while maintaining KERI protocol compliance and regulatory requirements.

## 1. Core Audit Logging Service

### 1.1 Edge Protection Audit Service
```java
@Service
public class EdgeProtectionAuditService {
    
    @Autowired
    private AuditEventRepository auditEventRepository;
    
    @Autowired
    private SecurityIncidentRepository securityIncidentRepository;
    
    @Autowired
    private AlertService alertService;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    private static final Logger logger = LoggerFactory.getLogger(EdgeProtectionAuditService.class);
    
    // ==================== CHALLENGE OPERATIONS ====================
    
    public void logChallengeGeneration(String mendixUserId, String sessionId, String challenge) {
        try {
            AuditEvent event = createBaseAuditEvent(AuditEventType.CHALLENGE_GENERATED, mendixUserId);
            event.setSessionId(sessionId);
            event.setDescription("QR code challenge generated for account linking");
            
            Map<String, Object> details = new HashMap<>();
            details.put("challenge_length", challenge.length());
            details.put("session_id", sessionId);
            details.put("generation_method", "secure_random");
            
            event.setEventDetails(objectMapper.writeValueAsString(details));
            event.setSecurityLevel(SecurityLevel.MEDIUM);
            
            auditEventRepository.save(event);
            
        } catch (Exception e) {
            logger.error("Failed to log challenge generation", e);
        }
    }
    
    public void logChallengeVerificationFailure(String aid, String sessionId) {
        try {
            AuditEvent event = createBaseAuditEvent(AuditEventType.CHALLENGE_VERIFICATION_FAILED, null);
            event.setAid(aid);
            event.setSessionId(sessionId);
            event.setDescription("Challenge verification failed - security concern");
            
            Map<String, Object> details = new HashMap<>();
            details.put("aid", aid);
            details.put("session_id", sessionId);
            details.put("failure_reason", "signature_verification_failed");
            
            event.setEventDetails(objectMapper.writeValueAsString(details));
            event.setSecurityLevel(SecurityLevel.HIGH);
            
            auditEventRepository.save(event);
            
            // Alert on verification failures
            if (isHighRiskVerificationFailure(aid)) {
                alertService.sendSecurityAlert(
                    "High Risk Challenge Verification Failure",
                    "AID: " + aid + ", Session: " + sessionId
                );
            }
            
        } catch (Exception e) {
            logger.error("Failed to log challenge verification failure", e);
        }
    }
    
    public void logChallengeVerificationError(String sessionId, String errorMessage) {
        try {
            AuditEvent event = createBaseAuditEvent(AuditEventType.CHALLENGE_VERIFICATION_ERROR, null);
            event.setSessionId(sessionId);
            event.setDescription("Challenge verification error occurred");
            
            Map<String, Object> details = new HashMap<>();
            details.put("session_id", sessionId);
            details.put("error_message", errorMessage);
            details.put("error_type", "system_error");
            
            event.setEventDetails(objectMapper.writeValueAsString(details));
            event.setSecurityLevel(SecurityLevel.MEDIUM);
            
            auditEventRepository.save(event);
            
        } catch (Exception e) {
            logger.error("Failed to log challenge verification error", e);
        }
    }
    
    // ==================== SIGNATURE VERIFICATION ====================
    
    public void logSignatureVerificationFailure(String aid, String signedData, String signature) {
        try {
            AuditEvent event = createBaseAuditEvent(AuditEventType.SIGNATURE_VERIFICATION_FAILED, null);
            event.setAid(aid);
            event.setDescription("KERI signature verification failed");
            
            Map<String, Object> details = new HashMap<>();
            details.put("aid", aid);
            details.put("data_hash", calculateSHA256Hash(signedData));
            details.put("signature_length", signature.length());
            details.put("verification_method", "ed25519_public_key");
            
            event.setEventDetails(objectMapper.writeValueAsString(details));
            event.setSecurityLevel(SecurityLevel.HIGH);
            
            auditEventRepository.save(event);
            
            // Track repeated failures
            trackRepeatedFailures(aid, AuditEventType.SIGNATURE_VERIFICATION_FAILED);
            
        } catch (Exception e) {
            logger.error("Failed to log signature verification failure", e);
        }
    }
    
    public void logSuccessfulSignatureVerification(String aid, String signedData) {
        try {
            AuditEvent event = createBaseAuditEvent(AuditEventType.SIGNATURE_VERIFIED, null);
            event.setAid(aid);
            event.setDescription("KERI signature successfully verified");
            
            Map<String, Object> details = new HashMap<>();
            details.put("aid", aid);
            details.put("data_hash", calculateSHA256Hash(signedData));
            details.put("verification_method", "ed25519_public_key");
            details.put("public_key_source", "keria");
            
            event.setEventDetails(objectMapper.writeValueAsString(details));
            event.setSecurityLevel(SecurityLevel.LOW);
            
            auditEventRepository.save(event);
            
        } catch (Exception e) {
            logger.error("Failed to log successful signature verification", e);
        }
    }
    
    public void logPublicKeyNotFound(String aid) {
        try {
            AuditEvent event = createBaseAuditEvent(AuditEventType.PUBLIC_KEY_NOT_FOUND, null);
            event.setAid(aid);
            event.setDescription("Public key not found for AID");
            
            Map<String, Object> details = new HashMap<>();
            details.put("aid", aid);
            details.put("key_source", "keria");
            details.put("lookup_method", "api_call");
            
            event.setEventDetails(objectMapper.writeValueAsString(details));
            event.setSecurityLevel(SecurityLevel.MEDIUM);
            
            auditEventRepository.save(event);
            
        } catch (Exception e) {
            logger.error("Failed to log public key not found", e);
        }
    }
    
    // ==================== WITNESS VERIFICATION ====================
    
    public void logWitnessVerificationSuccess(String aid, int witnessCount) {
        try {
            AuditEvent event = createBaseAuditEvent(AuditEventType.WITNESS_VERIFICATION_SUCCESS, null);
            event.setAid(aid);
            event.setDescription("AID verified with witnesses");
            
            Map<String, Object> details = new HashMap<>();
            details.put("aid", aid);
            details.put("witness_count", witnessCount);
            details.put("verification_method", "majority_consensus");
            
            event.setEventDetails(objectMapper.writeValueAsString(details));
            event.setSecurityLevel(SecurityLevel.LOW);
            
            auditEventRepository.save(event);
            
        } catch (Exception e) {
            logger.error("Failed to log witness verification success", e);
        }
    }
    
    public void logWitnessVerificationFailure(String aid, String failureReason) {
        try {
            AuditEvent event = createBaseAuditEvent(AuditEventType.WITNESS_VERIFICATION_FAILED, null);
            event.setAid(aid);
            event.setDescription("Witness verification failed");
            
            Map<String, Object> details = new HashMap<>();
            details.put("aid", aid);
            details.put("failure_reason", failureReason);
            details.put("verification_method", "majority_consensus");
            
            event.setEventDetails(objectMapper.writeValueAsString(details));
            event.setSecurityLevel(SecurityLevel.HIGH);
            
            auditEventRepository.save(event);
            
            // Alert on witness failures
            alertService.sendSecurityAlert(
                "Witness Verification Failure",
                "AID: " + aid + ", Reason: " + failureReason
            );
            
        } catch (Exception e) {
            logger.error("Failed to log witness verification failure", e);
        }
    }
    
    // ==================== ACCOUNT LINKING ====================
    
    public void logSuccessfulAccountLinking(String mendixUserId, String veridianAid, String sessionId) {
        try {
            AuditEvent event = createBaseAuditEvent(AuditEventType.ACCOUNT_LINKED, mendixUserId);
            event.setAid(veridianAid);
            event.setSessionId(sessionId);
            event.setDescription("Account successfully linked");
            
            Map<String, Object> details = new HashMap<>();
            details.put("mendix_user_id", mendixUserId);
            details.put("veridian_aid", veridianAid);
            details.put("session_id", sessionId);
            details.put("linking_method", "qr_code_challenge_response");
            
            event.setEventDetails(objectMapper.writeValueAsString(details));
            event.setSecurityLevel(SecurityLevel.MEDIUM);
            
            auditEventRepository.save(event);
            
        } catch (Exception e) {
            logger.error("Failed to log successful account linking", e);
        }
    }
    
    public void logAccountLinkingFailure(String sessionId, String failureReason) {
        try {
            AuditEvent event = createBaseAuditEvent(AuditEventType.ACCOUNT_LINKING_FAILED, null);
            event.setSessionId(sessionId);
            event.setDescription("Account linking failed");
            
            Map<String, Object> details = new HashMap<>();
            details.put("session_id", sessionId);
            details.put("failure_reason", failureReason);
            details.put("linking_method", "qr_code_challenge_response");
            
            event.setEventDetails(objectMapper.writeValueAsString(details));
            event.setSecurityLevel(SecurityLevel.HIGH);
            
            auditEventRepository.save(event);
            
        } catch (Exception e) {
            logger.error("Failed to log account linking failure", e);
        }
    }
    
    // ==================== KEY ROTATION ====================
    
    public void logKeyRotationDetected(String aid) {
        try {
            AuditEvent event = createBaseAuditEvent(AuditEventType.KEY_ROTATION_DETECTED, null);
            event.setAid(aid);
            event.setDescription("Key rotation detected for AID");
            
            Map<String, Object> details = new HashMap<>();
            details.put("aid", aid);
            details.put("rotation_detection_method", "key_comparison");
            details.put("rotation_handled", "automatic");
            
            event.setEventDetails(objectMapper.writeValueAsString(details));
            event.setSecurityLevel(SecurityLevel.MEDIUM);
            
            auditEventRepository.save(event);
            
        } catch (Exception e) {
            logger.error("Failed to log key rotation detection", e);
        }
    }
    
    public void logKeyRotationProcessed(String aid, String newPublicKey) {
        try {
            AuditEvent event = createBaseAuditEvent(AuditEventType.KEY_ROTATION_PROCESSED, null);
            event.setAid(aid);
            event.setDescription("Key rotation processed successfully");
            
            Map<String, Object> details = new HashMap<>();
            details.put("aid", aid);
            details.put("new_public_key_hash", calculateSHA256Hash(newPublicKey));
            details.put("rotation_source", "mobile_app");
            
            event.setEventDetails(objectMapper.writeValueAsString(details));
            event.setSecurityLevel(SecurityLevel.HIGH);
            
            auditEventRepository.save(event);
            
        } catch (Exception e) {
            logger.error("Failed to log key rotation processing", e);
        }
    }
    
    // ==================== SECURITY INCIDENTS ====================
    
    public void logSecurityIncident(String incidentType, String aid, String description) {
        try {
            // Create audit event
            AuditEvent event = createBaseAuditEvent(AuditEventType.SECURITY_INCIDENT, null);
            event.setAid(aid);
            event.setDescription(description);
            
            Map<String, Object> details = new HashMap<>();
            details.put("incident_type", incidentType);
            details.put("aid", aid);
            details.put("description", description);
            
            event.setEventDetails(objectMapper.writeValueAsString(details));
            event.setSecurityLevel(SecurityLevel.CRITICAL);
            
            auditEventRepository.save(event);
            
            // Create security incident record
            SecurityIncident incident = new SecurityIncident();
            incident.setIncidentType(incidentType);
            incident.setAid(aid);
            incident.setDescription(description);
            incident.setTimestamp(Instant.now());
            incident.setSeverity(SecuritySeverity.HIGH);
            incident.setStatus(IncidentStatus.OPEN);
            
            securityIncidentRepository.save(incident);
            
            // Send immediate alert
            alertService.sendCriticalAlert(
                "Security Incident Detected",
                "Type: " + incidentType + ", AID: " + aid + ", Description: " + description
            );
            
        } catch (Exception e) {
            logger.error("Failed to log security incident", e);
        }
    }
    
    public void logEdgeProtectionViolation(String operation, String aid, String violationType) {
        try {
            AuditEvent event = createBaseAuditEvent(AuditEventType.EDGE_PROTECTION_VIOLATION, null);
            event.setAid(aid);
            event.setDescription("Edge protection violation detected");
            
            Map<String, Object> details = new HashMap<>();
            details.put("operation", operation);
            details.put("aid", aid);
            details.put("violation_type", violationType);
            details.put("severity", "CRITICAL");
            
            event.setEventDetails(objectMapper.writeValueAsString(details));
            event.setSecurityLevel(SecurityLevel.CRITICAL);
            
            auditEventRepository.save(event);
            
            // Immediate incident response
            logSecurityIncident("EDGE_PROTECTION_VIOLATION", aid, 
                "Edge protection violation in operation: " + operation);
            
        } catch (Exception e) {
            logger.error("Failed to log edge protection violation", e);
        }
    }
    
    // ==================== HELPER METHODS ====================
    
    private AuditEvent createBaseAuditEvent(AuditEventType eventType, String mendixUserId) {
        AuditEvent event = new AuditEvent();
        event.setEventType(eventType);
        event.setMendixUserId(mendixUserId);
        event.setTimestamp(Instant.now());
        event.setSource("landano-veridian-integration");
        event.setIpAddress(getCurrentClientIP());
        event.setUserAgent(getCurrentUserAgent());
        return event;
    }
    
    private String calculateSHA256Hash(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hashBytes);
        } catch (Exception e) {
            logger.error("Failed to calculate SHA-256 hash", e);
            return "hash_calculation_failed";
        }
    }
    
    private boolean isHighRiskVerificationFailure(String aid) {
        // Check for repeated failures in the last hour
        Instant oneHourAgo = Instant.now().minus(Duration.ofHours(1));
        
        long recentFailures = auditEventRepository.countByAidAndEventTypeAndTimestampAfter(
            aid, AuditEventType.CHALLENGE_VERIFICATION_FAILED, oneHourAgo);
        
        return recentFailures >= 3; // 3 failures in 1 hour = high risk
    }
    
    private void trackRepeatedFailures(String aid, AuditEventType eventType) {
        try {
            Instant lastHour = Instant.now().minus(Duration.ofHours(1));
            
            long recentFailures = auditEventRepository.countByAidAndEventTypeAndTimestampAfter(
                aid, eventType, lastHour);
            
            if (recentFailures >= 5) {
                logSecurityIncident("REPEATED_VERIFICATION_FAILURES", aid,
                    "Multiple verification failures detected: " + recentFailures);
            }
            
        } catch (Exception e) {
            logger.error("Failed to track repeated failures", e);
        }
    }
    
    private String getCurrentClientIP() {
        // Get client IP from request context
        try {
            HttpServletRequest request = 
                ((ServletRequestAttributes) RequestContextHolder.getRequestAttributes()).getRequest();
            
            String xForwardedFor = request.getHeader("X-Forwarded-For");
            if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
                return xForwardedFor.split(",")[0].trim();
            }
            return request.getRemoteAddr();
        } catch (Exception e) {
            return "unknown";
        }
    }
    
    private String getCurrentUserAgent() {
        try {
            HttpServletRequest request = 
                ((ServletRequestAttributes) RequestContextHolder.getRequestAttributes()).getRequest();
            return request.getHeader("User-Agent");
        } catch (Exception e) {
            return "unknown";
        }
    }
}
```

### 1.2 Audit Event Entities
```java
@Entity
@Table(name = "audit_events")
public class AuditEvent {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false)
    private AuditEventType eventType;
    
    @Column(name = "mendix_user_id")
    private String mendixUserId;
    
    @Column(name = "aid")
    private String aid;
    
    @Column(name = "session_id")
    private String sessionId;
    
    @Column(name = "timestamp", nullable = false)
    private Instant timestamp;
    
    @Column(name = "description")
    private String description;
    
    @Column(name = "event_details", columnDefinition = "TEXT")
    private String eventDetails;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "security_level", nullable = false)
    private SecurityLevel securityLevel;
    
    @Column(name = "source")
    private String source;
    
    @Column(name = "ip_address")
    private String ipAddress;
    
    @Column(name = "user_agent")
    private String userAgent;
    
    @Column(name = "correlation_id")
    private String correlationId;
    
    // Getters and setters
    // ... standard getters and setters
}
```

### 1.3 Security Incident Entity
```java
@Entity
@Table(name = "security_incidents")
public class SecurityIncident {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(name = "incident_type", nullable = false)
    private String incidentType;
    
    @Column(name = "aid")
    private String aid;
    
    @Column(name = "description", nullable = false)
    private String description;
    
    @Column(name = "timestamp", nullable = false)
    private Instant timestamp;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false)
    private SecuritySeverity severity;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private IncidentStatus status;
    
    @Column(name = "assigned_to")
    private String assignedTo;
    
    @Column(name = "resolution_notes", columnDefinition = "TEXT")
    private String resolutionNotes;
    
    @Column(name = "resolved_at")
    private Instant resolvedAt;
    
    // Getters and setters
    // ... standard getters and setters
}
```

### 1.4 Audit Event Types and Enums
```java
public enum AuditEventType {
    // Challenge Operations
    CHALLENGE_GENERATED,
    CHALLENGE_VERIFICATION_FAILED,
    CHALLENGE_VERIFICATION_ERROR,
    CHALLENGE_EXPIRED,
    
    // Signature Operations
    SIGNATURE_VERIFIED,
    SIGNATURE_VERIFICATION_FAILED,
    PUBLIC_KEY_NOT_FOUND,
    
    // Witness Operations
    WITNESS_VERIFICATION_SUCCESS,
    WITNESS_VERIFICATION_FAILED,
    WITNESS_VERIFICATION_ERROR,
    
    // Account Operations
    ACCOUNT_LINKED,
    ACCOUNT_LINKING_FAILED,
    ACCOUNT_UNLINKED,
    
    // Key Management
    KEY_ROTATION_DETECTED,
    KEY_ROTATION_PROCESSED,
    KEY_ROTATION_FAILED,
    
    // Security Events
    SECURITY_INCIDENT,
    EDGE_PROTECTION_VIOLATION,
    UNAUTHORIZED_ACCESS_ATTEMPT,
    
    // System Events
    SYSTEM_ERROR,
    CONFIGURATION_CHANGE,
    SERVICE_STARTED,
    SERVICE_STOPPED
}

public enum SecurityLevel {
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL
}

public enum SecuritySeverity {
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL
}

public enum IncidentStatus {
    OPEN,
    INVESTIGATING,
    RESOLVED,
    CLOSED
}
```

## 2. Audit Event Processing and Analysis

### 2.1 Audit Event Processor
```java
@Component
public class AuditEventProcessor {
    
    @Autowired
    private AuditEventRepository auditEventRepository;
    
    @Autowired
    private SecurityIncidentRepository securityIncidentRepository;
    
    @Autowired
    private AlertService alertService;
    
    @EventListener
    @Async
    public void processAuditEvent(AuditEvent event) {
        try {
            // Process based on event type
            switch (event.getEventType()) {
                case SIGNATURE_VERIFICATION_FAILED:
                    processSignatureVerificationFailure(event);
                    break;
                case CHALLENGE_VERIFICATION_FAILED:
                    processChallengeVerificationFailure(event);
                    break;
                case WITNESS_VERIFICATION_FAILED:
                    processWitnessVerificationFailure(event);
                    break;
                case EDGE_PROTECTION_VIOLATION:
                    processEdgeProtectionViolation(event);
                    break;
                default:
                    // General processing
                    processGeneralEvent(event);
            }
            
            // Update security metrics
            updateSecurityMetrics(event);
            
        } catch (Exception e) {
            logger.error("Failed to process audit event", e);
        }
    }
    
    private void processSignatureVerificationFailure(AuditEvent event) {
        // Check for patterns of failure
        String aid = event.getAid();
        
        if (aid != null) {
            long recentFailures = countRecentFailures(aid, AuditEventType.SIGNATURE_VERIFICATION_FAILED);
            
            if (recentFailures >= 3) {
                createSecurityIncident(
                    "REPEATED_SIGNATURE_FAILURES",
                    aid,
                    "Multiple signature verification failures detected"
                );
            }
        }
    }
    
    private void processChallengeVerificationFailure(AuditEvent event) {
        // Analyze challenge failure patterns
        String sessionId = event.getSessionId();
        
        if (sessionId != null) {
            // Check for brute force attempts
            long sessionFailures = countSessionFailures(sessionId);
            
            if (sessionFailures >= 2) {
                createSecurityIncident(
                    "CHALLENGE_BRUTE_FORCE",
                    event.getAid(),
                    "Multiple challenge verification failures for session"
                );
            }
        }
    }
    
    private void processWitnessVerificationFailure(AuditEvent event) {
        // Alert on witness failures as they indicate network issues
        alertService.sendWarningAlert(
            "Witness Verification Failure",
            "AID: " + event.getAid() + " failed witness verification"
        );
    }
    
    private void processEdgeProtectionViolation(AuditEvent event) {
        // Immediate critical incident
        createSecurityIncident(
            "EDGE_PROTECTION_VIOLATION",
            event.getAid(),
            "Critical edge protection violation detected"
        );
        
        // Send immediate alert
        alertService.sendCriticalAlert(
            "CRITICAL: Edge Protection Violation",
            "Operation: " + event.getDescription()
        );
    }
    
    private void processGeneralEvent(AuditEvent event) {
        // General event processing
        if (event.getSecurityLevel() == SecurityLevel.CRITICAL) {
            alertService.sendCriticalAlert(
                "Critical Security Event",
                "Event: " + event.getEventType() + ", Description: " + event.getDescription()
            );
        }
    }
    
    private void createSecurityIncident(String type, String aid, String description) {
        SecurityIncident incident = new SecurityIncident();
        incident.setIncidentType(type);
        incident.setAid(aid);
        incident.setDescription(description);
        incident.setTimestamp(Instant.now());
        incident.setSeverity(SecuritySeverity.HIGH);
        incident.setStatus(IncidentStatus.OPEN);
        
        securityIncidentRepository.save(incident);
    }
    
    private long countRecentFailures(String aid, AuditEventType eventType) {
        Instant oneHourAgo = Instant.now().minus(Duration.ofHours(1));
        return auditEventRepository.countByAidAndEventTypeAndTimestampAfter(aid, eventType, oneHourAgo);
    }
    
    private long countSessionFailures(String sessionId) {
        return auditEventRepository.countBySessionIdAndEventType(sessionId, AuditEventType.CHALLENGE_VERIFICATION_FAILED);
    }
    
    private void updateSecurityMetrics(AuditEvent event) {
        // Update metrics for monitoring
        // This would integrate with your metrics system (Micrometer, etc.)
    }
}
```

### 2.2 Security Monitoring Service
```java
@Service
public class SecurityMonitoringService {
    
    @Autowired
    private AuditEventRepository auditEventRepository;
    
    @Autowired
    private SecurityIncidentRepository securityIncidentRepository;
    
    @Autowired
    private AlertService alertService;
    
    @Scheduled(fixedRate = 300000) // Every 5 minutes
    public void monitorSecurityEvents() {
        try {
            // Monitor for security patterns
            monitorSignatureVerificationFailures();
            monitorChallengeVerificationFailures();
            monitorWitnessVerificationFailures();
            monitorEdgeProtectionCompliance();
            
        } catch (Exception e) {
            logger.error("Security monitoring failed", e);
        }
    }
    
    private void monitorSignatureVerificationFailures() {
        Instant lastHour = Instant.now().minus(Duration.ofHours(1));
        
        long totalFailures = auditEventRepository.countByEventTypeAndTimestampAfter(
            AuditEventType.SIGNATURE_VERIFICATION_FAILED, lastHour);
        
        if (totalFailures > 50) {
            alertService.sendWarningAlert(
                "High Signature Verification Failures",
                "Total failures in last hour: " + totalFailures
            );
        }
    }
    
    private void monitorChallengeVerificationFailures() {
        Instant lastHour = Instant.now().minus(Duration.ofHours(1));
        
        long challengeFailures = auditEventRepository.countByEventTypeAndTimestampAfter(
            AuditEventType.CHALLENGE_VERIFICATION_FAILED, lastHour);
        
        if (challengeFailures > 20) {
            alertService.sendWarningAlert(
                "High Challenge Verification Failures",
                "Challenge failures in last hour: " + challengeFailures
            );
        }
    }
    
    private void monitorWitnessVerificationFailures() {
        Instant lastHour = Instant.now().minus(Duration.ofHours(1));
        
        long witnessFailures = auditEventRepository.countByEventTypeAndTimestampAfter(
            AuditEventType.WITNESS_VERIFICATION_FAILED, lastHour);
        
        if (witnessFailures > 10) {
            alertService.sendWarningAlert(
                "Witness Verification Issues",
                "Witness failures in last hour: " + witnessFailures
            );
        }
    }
    
    private void monitorEdgeProtectionCompliance() {
        Instant lastDay = Instant.now().minus(Duration.ofDays(1));
        
        long edgeViolations = auditEventRepository.countByEventTypeAndTimestampAfter(
            AuditEventType.EDGE_PROTECTION_VIOLATION, lastDay);
        
        if (edgeViolations > 0) {
            alertService.sendCriticalAlert(
                "CRITICAL: Edge Protection Violations",
                "Violations in last 24 hours: " + edgeViolations
            );
        }
    }
    
    public SecurityMetrics getSecurityMetrics() {
        Instant last24Hours = Instant.now().minus(Duration.ofDays(1));
        
        return SecurityMetrics.builder()
            .totalEvents(auditEventRepository.countByTimestampAfter(last24Hours))
            .signatureVerificationFailures(auditEventRepository.countByEventTypeAndTimestampAfter(
                AuditEventType.SIGNATURE_VERIFICATION_FAILED, last24Hours))
            .challengeVerificationFailures(auditEventRepository.countByEventTypeAndTimestampAfter(
                AuditEventType.CHALLENGE_VERIFICATION_FAILED, last24Hours))
            .witnessVerificationFailures(auditEventRepository.countByEventTypeAndTimestampAfter(
                AuditEventType.WITNESS_VERIFICATION_FAILED, last24Hours))
            .edgeProtectionViolations(auditEventRepository.countByEventTypeAndTimestampAfter(
                AuditEventType.EDGE_PROTECTION_VIOLATION, last24Hours))
            .openSecurityIncidents(securityIncidentRepository.countByStatus(IncidentStatus.OPEN))
            .build();
    }
}
```

## 3. Audit Reporting and Compliance

### 3.1 Audit Report Generator
```java
@Service
public class AuditReportGenerator {
    
    @Autowired
    private AuditEventRepository auditEventRepository;
    
    @Autowired
    private SecurityIncidentRepository securityIncidentRepository;
    
    public AuditReport generateDailyReport(LocalDate date) {
        Instant startOfDay = date.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant endOfDay = date.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        
        List<AuditEvent> events = auditEventRepository.findByTimestampBetween(startOfDay, endOfDay);
        
        return AuditReport.builder()
            .reportDate(date)
            .totalEvents(events.size())
            .eventsByType(groupEventsByType(events))
            .eventsBySecurityLevel(groupEventsBySecurityLevel(events))
            .securityIncidents(getSecurityIncidents(startOfDay, endOfDay))
            .edgeProtectionCompliance(checkEdgeProtectionCompliance(events))
            .build();
    }
    
    public ComplianceReport generateComplianceReport(LocalDate startDate, LocalDate endDate) {
        Instant start = startDate.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant end = endDate.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        
        List<AuditEvent> events = auditEventRepository.findByTimestampBetween(start, end);
        
        return ComplianceReport.builder()
            .reportPeriod(startDate + " to " + endDate)
            .totalAuditEvents(events.size())
            .edgeProtectionCompliance(checkEdgeProtectionCompliance(events))
            .signatureVerificationSuccessRate(calculateSignatureSuccessRate(events))
            .challengeVerificationSuccessRate(calculateChallengeSuccessRate(events))
            .witnessVerificationSuccessRate(calculateWitnessSuccessRate(events))
            .securityIncidentSummary(getSecurityIncidentSummary(start, end))
            .build();
    }
    
    private Map<AuditEventType, Long> groupEventsByType(List<AuditEvent> events) {
        return events.stream()
            .collect(Collectors.groupingBy(AuditEvent::getEventType, Collectors.counting()));
    }
    
    private Map<SecurityLevel, Long> groupEventsBySecurityLevel(List<AuditEvent> events) {
        return events.stream()
            .collect(Collectors.groupingBy(AuditEvent::getSecurityLevel, Collectors.counting()));
    }
    
    private boolean checkEdgeProtectionCompliance(List<AuditEvent> events) {
        return events.stream()
            .noneMatch(event -> event.getEventType() == AuditEventType.EDGE_PROTECTION_VIOLATION);
    }
    
    private double calculateSignatureSuccessRate(List<AuditEvent> events) {
        long totalSignatureEvents = events.stream()
            .filter(event -> event.getEventType() == AuditEventType.SIGNATURE_VERIFIED ||
                           event.getEventType() == AuditEventType.SIGNATURE_VERIFICATION_FAILED)
            .count();
        
        long successfulSignatures = events.stream()
            .filter(event -> event.getEventType() == AuditEventType.SIGNATURE_VERIFIED)
            .count();
        
        return totalSignatureEvents > 0 ? (double) successfulSignatures / totalSignatureEvents : 0.0;
    }
    
    private double calculateChallengeSuccessRate(List<AuditEvent> events) {
        long totalChallengeEvents = events.stream()
            .filter(event -> event.getEventType() == AuditEventType.ACCOUNT_LINKED ||
                           event.getEventType() == AuditEventType.CHALLENGE_VERIFICATION_FAILED)
            .count();
        
        long successfulChallenges = events.stream()
            .filter(event -> event.getEventType() == AuditEventType.ACCOUNT_LINKED)
            .count();
        
        return totalChallengeEvents > 0 ? (double) successfulChallenges / totalChallengeEvents : 0.0;
    }
    
    private double calculateWitnessSuccessRate(List<AuditEvent> events) {
        long totalWitnessEvents = events.stream()
            .filter(event -> event.getEventType() == AuditEventType.WITNESS_VERIFICATION_SUCCESS ||
                           event.getEventType() == AuditEventType.WITNESS_VERIFICATION_FAILED)
            .count();
        
        long successfulWitness = events.stream()
            .filter(event -> event.getEventType() == AuditEventType.WITNESS_VERIFICATION_SUCCESS)
            .count();
        
        return totalWitnessEvents > 0 ? (double) successfulWitness / totalWitnessEvents : 0.0;
    }
    
    private List<SecurityIncident> getSecurityIncidents(Instant start, Instant end) {
        return securityIncidentRepository.findByTimestampBetween(start, end);
    }
    
    private SecurityIncidentSummary getSecurityIncidentSummary(Instant start, Instant end) {
        List<SecurityIncident> incidents = getSecurityIncidents(start, end);
        
        return SecurityIncidentSummary.builder()
            .totalIncidents(incidents.size())
            .openIncidents(incidents.stream().filter(i -> i.getStatus() == IncidentStatus.OPEN).count())
            .resolvedIncidents(incidents.stream().filter(i -> i.getStatus() == IncidentStatus.RESOLVED).count())
            .incidentsBySeverity(incidents.stream().collect(
                Collectors.groupingBy(SecurityIncident::getSeverity, Collectors.counting())))
            .build();
    }
}
```

## 4. Configuration and Deployment

### 4.1 Audit Configuration
```yaml
# application-audit.yml
audit:
  enabled: true
  retention_days: 365
  
  events:
    log_all_events: true
    log_successful_operations: true
    log_failed_operations: true
    log_security_events: true
    
  security_monitoring:
    enabled: true
    check_interval: 300000 # 5 minutes
    
    thresholds:
      signature_failures_per_hour: 50
      challenge_failures_per_hour: 20
      witness_failures_per_hour: 10
      edge_protection_violations_per_day: 0
      
  reporting:
    daily_reports: true
    weekly_reports: true
    monthly_reports: true
    compliance_reports: true
    
  alerts:
    enabled: true
    email_notifications: true
    slack_notifications: true
    sms_notifications: false
```

### 4.2 Database Configuration
```sql
-- Audit Events Table
CREATE TABLE audit_events (
    id VARCHAR(36) PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    mendix_user_id VARCHAR(100),
    aid VARCHAR(100),
    session_id VARCHAR(100),
    timestamp TIMESTAMP NOT NULL,
    description TEXT,
    event_details TEXT,
    security_level VARCHAR(20) NOT NULL,
    source VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    correlation_id VARCHAR(100),
    INDEX idx_event_type (event_type),
    INDEX idx_aid (aid),
    INDEX idx_timestamp (timestamp),
    INDEX idx_security_level (security_level)
);

-- Security Incidents Table
CREATE TABLE security_incidents (
    id VARCHAR(36) PRIMARY KEY,
    incident_type VARCHAR(100) NOT NULL,
    aid VARCHAR(100),
    description TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    assigned_to VARCHAR(100),
    resolution_notes TEXT,
    resolved_at TIMESTAMP,
    INDEX idx_incident_type (incident_type),
    INDEX idx_aid (aid),
    INDEX idx_timestamp (timestamp),
    INDEX idx_status (status)
);
```

## Conclusion

This comprehensive audit logging implementation provides:

1. **Complete Audit Trail**: All edge protection operations are logged
2. **Security Monitoring**: Real-time monitoring of security events
3. **Incident Management**: Automated security incident detection and response
4. **Compliance Reporting**: Regular compliance and audit reports
5. **Alerting System**: Immediate alerts for security violations
6. **Pattern Detection**: Identification of security patterns and threats
7. **Retention Management**: Configurable audit log retention
8. **Performance Optimization**: Efficient database indexing and querying

The audit logging system ensures complete visibility into edge protection operations while maintaining performance and providing the compliance documentation required for enterprise security standards.