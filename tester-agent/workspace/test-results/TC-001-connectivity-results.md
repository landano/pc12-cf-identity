# Test Results: TC-001 - Sandbox Connectivity Validation

**Test Date:** 2025-07-18 13:29:27 UTC
**Test Case:** TC-001
**Tester:** Automated Test Script

## Test Execution Results

### Boot URL

**URL:** https://keria-boot.demo.idw-sandboxes.cf-deployments.org/health

**Status:** PASS
**HTTP Code:** 405

**Response Headers:**
```
HTTP/1.1 405 Method Not Allowed
Server: nginx
Date: Fri, 18 Jul 2025 13:29:27 GMT
Content-Type: application/json
Content-Length: 35
Connection: keep-alive
Allow: GET, OPTIONS
Vary: Accept
Strict-Transport-Security: max-age=31536000
X-Frame-Options: deny
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block

```

---

### KERIA URL

**URL:** https://keria.demo.idw-sandboxes.cf-deployments.org/health

**Status:** PASS
**HTTP Code:** 401

**Response Headers:**
```
HTTP/1.1 401 Unauthorized
Server: nginx
Date: Fri, 18 Jul 2025 13:29:28 GMT
Content-Type: application/json
Content-Length: 0
Connection: keep-alive
Access-Control-Allow-Headers: *
Access-Control-Allow-Methods: *
Access-Control-Allow-Origin: *
Access-Control-Expose-Headers: *
Access-Control-Max-Age: 1728000
Strict-Transport-Security: max-age=31536000
X-Frame-Options: deny
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block

```

---

### Credential UI

**URL:** https://cred-issuance-ui.demo.idw-sandboxes.cf-deployments.org/

**Status:** PASS
**HTTP Code:** 200

**Response Headers:**
```
HTTP/1.1 200 OK
Server: nginx
Date: Fri, 18 Jul 2025 13:29:28 GMT
Content-Type: text/html
Content-Length: 1442
Connection: keep-alive
Accept-Ranges: bytes
Cache-Control: no-cache
Etag: "67f3b72c-5a2"
Expires: Fri, 18 Jul 2025 13:29:27 GMT
Last-Modified: Mon, 07 Apr 2025 11:29:48 GMT
Vary: Accept-Encoding
Strict-Transport-Security: max-age=31536000
X-Frame-Options: deny
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block

```

---

### TLS Configuration Test

**TLS 1.3 Support:** PASS

---

## Summary

**Test Completion Time:** 2025-07-18 13:29:29 UTC

**Overall Result:** PASSED - All endpoints accessible and TLS 1.3 supported
