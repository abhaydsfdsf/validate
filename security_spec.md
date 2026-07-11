# Firebase Security Specification

This document details the data invariants, security constraints, and adversarial test scenarios (the "Dirty Dozen") designed to audit and harden the application's Firestore rules.

## 1. Data Invariants & Zero-Trust Constraints

1. **Identity Isolation (Owner Lock)**: Any resource (itinerary, study plan, triage, billing, subscription) created in Firestore MUST have an owner ID (`userId` or document path) matching the authenticated Firebase user (`request.auth.uid`). No user can read, list, create, or update another user's resource.
2. **Strict Schema Constraints**: All writes (create & update) must match the complete properties, size bounds, and data types specified in `firebase-blueprint.json`.
3. **Temporal Integrity**: Creation timestamps must match the server-generated `request.time`.
4. **State Integrity**: Core fields like `userId` and `createdAt` are completely immutable once created.
5. **ID Path Safety**: All path variables must pass regex ID validation (`isValidId`) to prevent resource poisoning.

---

## 2. The "Dirty Dozen" Malicious Payloads

The following 12 payloads represent attempts to break identity, integrity, state, or to run resource exhaustion ("Denial of Wallet") attacks.

### Payload 1: Identity Spoofing on User Registration
An authenticated user (`uid: alice_123`) attempts to create or update a user profile with `userId = bob_456` to hijack Bob's profile.
```json
{
  "uid": "bob_456",
  "email": "bob@gmail.com",
  "createdAt": "2026-07-11T07:00:00Z"
}
```
*Expected Result: PERMISSION_DENIED*

### Payload 2: Privilege Escalation (Self-Admin Claims)
An authenticated user (`uid: alice_123`) attempts to create a profile including a custom role or unauthorized admin flag.
```json
{
  "uid": "alice_123",
  "email": "alice@gmail.com",
  "role": "admin",
  "isAdmin": true
}
```
*Expected Result: PERMISSION_DENIED*

### Payload 3: Subscription Hijacking
An authenticated user (`uid: alice_123`) attempts to create an agent subscription belonging to another user (`bob_456`).
```json
{
  "userId": "bob_456",
  "agentId": "travel_planner",
  "planName": "Monthly Starter",
  "status": "Active",
  "licenseKey": "MALICIOUS-TOKEN",
  "priceCharged": "$15.00"
}
```
*Expected Result: PERMISSION_DENIED*

### Payload 4: Travel Itinerary Theft
An authenticated user (`uid: alice_123`) attempts to write a travel itinerary where `userId = bob_456`.
```json
{
  "userId": "bob_456",
  "destination": "Paris, France",
  "budget": "Luxury",
  "durationDays": "5",
  "itineraryText": "Some mock flight details."
}
```
*Expected Result: PERMISSION_DENIED*

### Payload 5: Value Poisoning (Buffer Overflow Attack)
An authenticated user attempts to write a travel itinerary with an extremely large destination name (1MB of characters) to trigger memory and storage billing exhaustion.
```json
{
  "userId": "alice_123",
  "destination": "A[Repeat 1000000 times]",
  "budget": "Luxury",
  "durationDays": "5",
  "itineraryText": "Standard details."
}
```
*Expected Result: PERMISSION_DENIED*

### Payload 6: ID Path Character Poisoning
An attacker attempts to inject a SQL-injection style path variable or junk unicode chars as a document ID.
```json
{
  "itineraryId": "itinerary_id_with_special_chars_<script>alert('xss')</script>_$$$"
}
```
*Expected Result: PERMISSION_DENIED*

### Payload 7: Study Plan Hijacking
An authenticated user (`uid: alice_123`) attempts to create a study plan where the `userId` is set to `bob_456`.
```json
{
  "userId": "bob_456",
  "syllabus": "Data Structures",
  "planText": "Daily study roadmap"
}
```
*Expected Result: PERMISSION_DENIED*

### Payload 8: Study Plan Incomplete Schema Write
An authenticated user tries to create a study plan while omitting required schema fields like `syllabus`.
```json
{
  "userId": "alice_123",
  "planText": "Roadmap only"
}
```
*Expected Result: PERMISSION_DENIED*

### Payload 9: Patient Triage Urgency Spoofing
An attacker tries to post a patient triage with an invalid urgency rating category (e.g., "CriticalEmergency") which is not permitted by allowed enums.
```json
{
  "userId": "alice_123",
  "patientName": "John Doe",
  "symptoms": "Fever",
  "urgency": "CriticalEmergency",
  "triageDetails": "Take aspirin"
}
```
*Expected Result: PERMISSION_DENIED*

### Payload 10: Patient Triage Type Invalidation
An authenticated user tries to post a patient triage with a `symptoms` field represented as a Boolean instead of a string.
```json
{
  "userId": "alice_123",
  "patientName": "John Doe",
  "symptoms": true,
  "urgency": "High",
  "triageDetails": "Critical care needed"
}
```
*Expected Result: PERMISSION_DENIED*

### Payload 11: Email Billing Hijacking
An authenticated user (`uid: alice_123`) attempts to create an email billing record for another client/user `bob_456`.
```json
{
  "userId": "bob_456",
  "clientName": "Bob Corp",
  "amount": "$150.00",
  "services": "Consulting",
  "emailSubject": "Invoicing",
  "emailBody": "Invoice details"
}
```
*Expected Result: PERMISSION_DENIED*

### Payload 12: Blanket PII Read Leak
An authenticated user (`uid: alice_123`) attempts to retrieve another user's personal email billing document (`billingId_bob_789`) without permission.
*Expected Result: PERMISSION_DENIED*

---

## 3. Mock Test Specification Runner (`firestore.rules.test.ts`)

```typescript
import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment } from "@firebase/rules-unit-testing";

// The specification runner maps testing scenarios verifying the 12 Dirty Dozen payloads return PERMISSION_DENIED.
```
