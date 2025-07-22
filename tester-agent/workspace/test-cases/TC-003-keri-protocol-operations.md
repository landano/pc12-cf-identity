# Test Case: TC-003 - KERI Protocol Operations

**Test Case ID:** TC-003
**Test Plan:** TP-001
**Issue:** ISSUE-001
**Priority:** High
**Type:** Functional Test
**Created:** 2025-07-18

## Test Description
Test core KERI protocol operations including AID creation, key rotation, witness coordination, and event streaming in the sandbox environment.

## Prerequisites
- TC-001 and TC-002 passed
- Authenticated Signify client available
- Understanding of KERI protocol basics
- Test witness endpoints available

## Test Data
```javascript
const keriTestData = {
  chiefAID: {
    name: 'landano-sandbox-chief-001',
    witnesses: ['witness1.demo.idw-sandboxes.cf-deployments.org'],
    threshold: 1
  },
  representativeAID: {
    name: 'landano-sandbox-rep-001',
    witnesses: ['witness1.demo.idw-sandboxes.cf-deployments.org'],
    threshold: 1
  }
};
```

## Test Steps

### Step 1: Create Chief AID
**Action:**
```javascript
async function createChiefAID(client) {
  const result = await client.identifiers().create({
    name: keriTestData.chiefAID.name,
    witnesses: keriTestData.chiefAID.witnesses,
    thold: keriTestData.chiefAID.threshold,
    wits: keriTestData.chiefAID.witnesses,
    count: 1,
    ncount: 1
  });
  
  console.log('Chief AID created:', result.prefix);
  return result;
}
```
**Expected Result:**
- AID created successfully
- Valid prefix returned
- Inception event logged
- Witness receipts received

### Step 2: Create Representative AID
**Action:**
```javascript
async function createRepresentativeAID(client) {
  const result = await client.identifiers().create({
    name: keriTestData.representativeAID.name,
    witnesses: keriTestData.representativeAID.witnesses,
    thold: keriTestData.representativeAID.threshold,
    wits: keriTestData.representativeAID.witnesses,
    count: 1,
    ncount: 1
  });
  
  console.log('Representative AID created:', result.prefix);
  return result;
}
```
**Expected Result:**
- Second AID created successfully
- Different prefix from Chief AID
- Proper event sequence
- Independent key material

### Step 3: Test Key Rotation
**Action:**
```javascript
async function testKeyRotation(client, aidPrefix) {
  const rotationResult = await client.identifiers().rotate({
    prefix: aidPrefix,
    witnesses: keriTestData.chiefAID.witnesses,
    thold: keriTestData.chiefAID.threshold
  });
  
  console.log('Key rotation completed:', rotationResult);
  return rotationResult;
}
```
**Expected Result:**
- Rotation event created
- New keys generated
- Previous keys marked as rotated
- Witness acknowledgment received
- AID prefix remains the same

### Step 4: Verify Witness Coordination
**Action:**
```javascript
async function verifyWitnessCoordination(client, aidPrefix) {
  const events = await client.keyEvents().get(aidPrefix);
  const receipts = await client.receipts().get(aidPrefix);
  
  return {
    eventCount: events.length,
    receiptCount: receipts.length,
    witnessesResponding: receipts.map(r => r.witness)
  };
}
```
**Expected Result:**
- Events properly witnessed
- Receipts from all witnesses
- Consistent event ordering
- No missing witness receipts

### Step 5: Test Event Streaming
**Action:**
```javascript
async function testEventStreaming(client, aidPrefix) {
  const eventLog = await client.keyEvents().get(aidPrefix);
  
  // Verify event sequence
  let previousSn = -1;
  for (const event of eventLog) {
    if (event.sn <= previousSn) {
      throw new Error('Event sequence broken');
    }
    previousSn = event.sn;
  }
  
  return {
    totalEvents: eventLog.length,
    latestSequence: previousSn,
    eventTypes: eventLog.map(e => e.type)
  };
}
```
**Expected Result:**
- Complete event log retrieved
- Sequential numbering correct
- All event types present
- No gaps in event sequence

## Pass Criteria
- Both AIDs created successfully
- Unique prefixes generated
- Key rotation completes without errors
- Witnesses respond to all events
- Event sequence integrity maintained
- No cryptographic failures

## Fail Criteria
- AID creation fails
- Duplicate prefixes generated
- Key rotation breaks AID
- Witness receipts missing
- Event sequence corrupted
- Timeout errors on operations

## Performance Expectations
- AID creation: < 5 seconds
- Key rotation: < 10 seconds
- Event retrieval: < 2 seconds
- Witness response: < 3 seconds

## Notes
- Capture all AID prefixes for later tests
- Document any witness delays
- Note event processing times
- Save event logs for analysis
- Test both success and error scenarios