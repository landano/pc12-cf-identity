#!/usr/bin/env node

/**
 * API Authentication Test Script
 * Test Case: TC-002
 * Date: 2025-07-18
 * Purpose: Test Veridian API authentication mechanisms
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

// Test configuration
const testConfig = {
    bootUrl: 'https://keria-boot.demo.idw-sandboxes.cf-deployments.org',
    keriaUrl: 'https://keria.demo.idw-sandboxes.cf-deployments.org',
    credentialUiUrl: 'https://cred-issuance-ui.demo.idw-sandboxes.cf-deployments.org',
    passcode: 'sandbox-test-passcode-001',
    timeout: 30000
};

// Results file
const resultsFile = '../test-results/TC-002-authentication-results.md';

// Test results collector
const testResults = {
    startTime: new Date().toISOString(),
    tests: [],
    summary: {
        total: 0,
        passed: 0,
        failed: 0
    }
};

// Utility functions
function logTest(testName, status, details) {
    const result = {
        name: testName,
        status: status,
        timestamp: new Date().toISOString(),
        details: details || {}
    };
    testResults.tests.push(result);
    testResults.summary.total++;
    
    if (status === 'PASS') {
        testResults.summary.passed++;
        console.log(`✅ ${testName}: PASSED`);
    } else {
        testResults.summary.failed++;
        console.log(`❌ ${testName}: FAILED`);
        if (details.error) {
            console.log(`   Error: ${details.error}`);
        }
    }
}

function makeHttpsRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const requestOptions = {
            method: options.method || 'GET',
            timeout: testConfig.timeout,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'LandanoTester/1.0',
                ...options.headers
            }
        };

        const req = https.request(url, requestOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        if (options.body) {
            req.write(options.body);
        }

        req.end();
    });
}

// Test functions
async function testBasicAPIAccess() {
    console.log('\n🔍 Testing Basic API Access...');
    
    try {
        // Test KERIA API without authentication
        const response = await makeHttpsRequest(`${testConfig.keriaUrl}/`);
        
        if (response.statusCode === 401) {
            logTest('Basic API Access', 'PASS', {
                statusCode: response.statusCode,
                message: 'API correctly rejects unauthenticated requests'
            });
        } else {
            logTest('Basic API Access', 'FAIL', {
                statusCode: response.statusCode,
                error: 'Expected 401 Unauthorized for unauthenticated request'
            });
        }
    } catch (error) {
        logTest('Basic API Access', 'FAIL', {
            error: error.message
        });
    }
}

async function testInvalidAuthentication() {
    console.log('\n🔍 Testing Invalid Authentication...');
    
    try {
        // Test with invalid authorization header
        const response = await makeHttpsRequest(`${testConfig.keriaUrl}/agent`, {
            headers: {
                'Authorization': 'Bearer invalid-token-123'
            }
        });
        
        if (response.statusCode === 401 || response.statusCode === 403) {
            logTest('Invalid Authentication', 'PASS', {
                statusCode: response.statusCode,
                message: 'API correctly rejects invalid authentication'
            });
        } else {
            logTest('Invalid Authentication', 'FAIL', {
                statusCode: response.statusCode,
                error: 'Expected 401/403 for invalid authentication'
            });
        }
    } catch (error) {
        logTest('Invalid Authentication', 'FAIL', {
            error: error.message
        });
    }
}

async function testBootEndpoint() {
    console.log('\n🔍 Testing Boot Endpoint...');
    
    try {
        // Test boot endpoint for agent initialization
        const response = await makeHttpsRequest(`${testConfig.bootUrl}/boot`, {
            method: 'POST',
            body: JSON.stringify({
                name: 'test-agent',
                passcode: testConfig.passcode
            })
        });
        
        if (response.statusCode === 200 || response.statusCode === 201 || response.statusCode === 202) {
            logTest('Boot Endpoint', 'PASS', {
                statusCode: response.statusCode,
                message: 'Boot endpoint accessible and responding'
            });
        } else if (response.statusCode === 400) {
            logTest('Boot Endpoint', 'PASS', {
                statusCode: response.statusCode,
                message: 'Boot endpoint validates requests (400 Bad Request expected for test data)'
            });
        } else {
            logTest('Boot Endpoint', 'FAIL', {
                statusCode: response.statusCode,
                error: 'Unexpected response from boot endpoint'
            });
        }
    } catch (error) {
        logTest('Boot Endpoint', 'FAIL', {
            error: error.message
        });
    }
}

async function testAuthenticationHeaders() {
    console.log('\n🔍 Testing Authentication Headers...');
    
    try {
        // Test various authentication header formats
        const testCases = [
            { name: 'Bearer Token', header: 'Bearer test-token' },
            { name: 'Basic Auth', header: 'Basic ' + Buffer.from('user:pass').toString('base64') },
            { name: 'Custom Auth', header: 'KERI-Signature test-signature' }
        ];
        
        let passed = 0;
        for (const testCase of testCases) {
            try {
                const response = await makeHttpsRequest(`${testConfig.keriaUrl}/agent`, {
                    headers: {
                        'Authorization': testCase.header
                    }
                });
                
                // All should return 401/403 for invalid credentials
                if (response.statusCode === 401 || response.statusCode === 403) {
                    passed++;
                }
            } catch (error) {
                // Network errors are acceptable for this test
            }
        }
        
        if (passed === testCases.length) {
            logTest('Authentication Headers', 'PASS', {
                message: 'All authentication header formats properly rejected'
            });
        } else {
            logTest('Authentication Headers', 'FAIL', {
                error: `Only ${passed}/${testCases.length} header formats properly rejected`
            });
        }
    } catch (error) {
        logTest('Authentication Headers', 'FAIL', {
            error: error.message
        });
    }
}

async function testAPIEndpointSecurity() {
    console.log('\n🔍 Testing API Endpoint Security...');
    
    try {
        // Test common API endpoints for security
        const endpoints = [
            '/agent',
            '/identifiers',
            '/credentials',
            '/exchanges',
            '/notifications'
        ];
        
        let secureEndpoints = 0;
        for (const endpoint of endpoints) {
            try {
                const response = await makeHttpsRequest(`${testConfig.keriaUrl}${endpoint}`);
                
                // Should return 401 for unauthenticated access
                if (response.statusCode === 401) {
                    secureEndpoints++;
                }
            } catch (error) {
                // Network errors are acceptable
            }
        }
        
        if (secureEndpoints >= endpoints.length * 0.8) {
            logTest('API Endpoint Security', 'PASS', {
                message: `${secureEndpoints}/${endpoints.length} endpoints properly secured`
            });
        } else {
            logTest('API Endpoint Security', 'FAIL', {
                error: `Only ${secureEndpoints}/${endpoints.length} endpoints properly secured`
            });
        }
    } catch (error) {
        logTest('API Endpoint Security', 'FAIL', {
            error: error.message
        });
    }
}

async function testCORSConfiguration() {
    console.log('\n🔍 Testing CORS Configuration...');
    
    try {
        // Test OPTIONS request for CORS
        const response = await makeHttpsRequest(`${testConfig.keriaUrl}/agent`, {
            method: 'OPTIONS',
            headers: {
                'Origin': 'https://localhost:3000',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type, Authorization'
            }
        });
        
        const corsHeaders = response.headers;
        const hasCORS = corsHeaders['access-control-allow-origin'] || 
                       corsHeaders['access-control-allow-methods'] ||
                       corsHeaders['access-control-allow-headers'];
        
        if (hasCORS) {
            logTest('CORS Configuration', 'PASS', {
                message: 'CORS headers present and configured',
                headers: {
                    origin: corsHeaders['access-control-allow-origin'],
                    methods: corsHeaders['access-control-allow-methods'],
                    headers: corsHeaders['access-control-allow-headers']
                }
            });
        } else {
            logTest('CORS Configuration', 'FAIL', {
                error: 'CORS headers not found in response'
            });
        }
    } catch (error) {
        logTest('CORS Configuration', 'FAIL', {
            error: error.message
        });
    }
}

// Generate test report
function generateTestReport() {
    const report = `# Test Results: TC-002 - API Authentication Testing

**Test Date:** ${testResults.startTime}
**Test Case:** TC-002
**Tester:** Automated Test Script (Node.js)

## Test Summary

**Total Tests:** ${testResults.summary.total}
**Passed:** ${testResults.summary.passed}
**Failed:** ${testResults.summary.failed}
**Success Rate:** ${Math.round((testResults.summary.passed / testResults.summary.total) * 100)}%

## Test Results

${testResults.tests.map(test => `
### ${test.name}
**Status:** ${test.status}
**Timestamp:** ${test.timestamp}
${test.details.message ? `**Message:** ${test.details.message}` : ''}
${test.details.error ? `**Error:** ${test.details.error}` : ''}
${test.details.statusCode ? `**HTTP Status:** ${test.details.statusCode}` : ''}
${test.details.headers ? `**Headers:** ${JSON.stringify(test.details.headers, null, 2)}` : ''}

---
`).join('')}

## Overall Assessment

${testResults.summary.failed === 0 ? 
    '✅ **PASSED** - All authentication tests completed successfully' : 
    `❌ **FAILED** - ${testResults.summary.failed} test(s) failed`}

## Next Steps

- ${testResults.summary.failed === 0 ? 
    'Proceed to Phase 3: KERI Protocol Testing' : 
    'Review failed tests and address authentication issues'}

**Test Completion:** ${new Date().toISOString()}
`;

    fs.writeFileSync(resultsFile, report);
    console.log(`\n📊 Test report saved to: ${resultsFile}`);
}

// Main execution
async function runAuthenticationTests() {
    console.log('🚀 Starting API Authentication Tests...');
    console.log('=====================================\n');
    
    await testBasicAPIAccess();
    await testInvalidAuthentication();
    await testBootEndpoint();
    await testAuthenticationHeaders();
    await testAPIEndpointSecurity();
    await testCORSConfiguration();
    
    console.log('\n=====================================');
    console.log('🏁 Authentication Tests Complete');
    console.log(`📊 Results: ${testResults.summary.passed}/${testResults.summary.total} tests passed`);
    
    generateTestReport();
}

// Run tests
runAuthenticationTests().catch(console.error);