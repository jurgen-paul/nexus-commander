# Firestore Security Design Specification - Fortress Model

This document specifies the security requirements, data invariants, and negative test cases ("Dirty Dozen" payloads) to enforce absolute zero-trust validation for the Cloud Architect's database.

## 1. Core Data Invariants

1. **Self-Ownership (User Profile Isolation)**:
   - A user profile stored in `/user_profiles/{userId}` can only be read, created, updated, or deleted by the user whose authenticated UID exactly matches the physical `{userId}` document ID.
   - Unauthenticated reads or writes are strictly denied.
   - Blanket reads or listings of all user profiles are forbidden to safeguard PII.

2. **Schema & Typings Integrity**:
   - `alias`, `email`, `rank`, `accessLevel`, and `theme` fields must be strings size-bounded (e.g., keys cannot exceed 128 characters / 1MB payloads) and validly formed.
   - `userId` must equal the authenticated owner (`request.auth.uid`).

3. **Email Verification**:
   - All write operations require a verified email address (`request.auth.token.email_verified == true`).

4. **Immutability Invariant**:
   - The user's profile creation timestamp `createdAt` or identity identifier `userId` must remain unchanged after creation.

---

## 2. The "Dirty Dozen" Malicious Payloads

The following 12 JSON payloads attempt to violate security limits and must produce a `PERMISSION_DENIED` outcome under our ruleset.

### Payload 1: Mismatched ID Creation (Identity Hijacking)
- **Path**: `/user_profiles/attacker_uid`
- **Payload**: `{ "userId": "victim_uid", "alias": "SPOOFED_OP", "email": "spoof@nexus.one", "rank": "System Architect", "accessLevel": "ULTRA-VIOLET" }`
- **Violation**: Attempting to write a document where the nested `userId` points to a victim's UID instead of the authorizer's true UID.

### Payload 2: Cross-User Update (Orphaned Access Attempt)
- **Path**: `/user_profiles/victim_uid`
- **Payload**: `{ "alias": "GHOST_OPERATOR" }`
- **Violation**: Attacker authorized with `attacker_uid` trying to write or modify parts of the user profile belonging to `victim_uid`.

### Payload 3: Unverified Identity Spoofing (Email Trust Spoof)
- **Path**: `/user_profiles/user_uid`
- **Auth state**: `{ uid: "user_uid", token: { email_verified: false } }`
- **Payload**: `{ "userId": "user_uid", "alias": "UNVERIFIED_OP", "email": "unverified@nexus.one", "rank": "Junior Ops", "accessLevel": "LOW-CLEARANCE" }`
- **Violation**: Attempting profile initialization without verifying the active email first.

### Payload 4: Overlong Field Injection (Denial of Wallet Attack)
- **Path**: `/user_profiles/user_uid`
- **Payload**: `{ "userId": "user_uid", "alias": "A".repeat(10000), "email": "user@nexus.one", "rank": "System Architect", "accessLevel": "ULTRA-VIOLET" }`
- **Violation**: Injecting a massive string value into user profile fields to blow up billing storage limits.

### Payload 5: Admin Level Escalation (Self-Assigned Role)
- **Path**: `/user_profiles/user_uid`
- **Payload**: `{ "userId": "user_uid", "alias": "Operator", "email": "user@nexus.one", "rank": "System Architect", "accessLevel": "OVERLORD_SUPER_ADMIN_CLAIMS" }`
- **Violation**: Standard user attempting to set high status clear privilege parameters in custom fields themselves.

### Payload 6: Anonymous Operator Override
- **Path**: `/user_profiles/anonymous_user_uid`
- **Auth state**: `{ isAnonymous: true }`
- **Payload**: `{ "userId": "anonymous_user_uid", "alias": "Ghost", "email": "ghost@anon.org", "rank": "Noob", "accessLevel": "NONE" }`
- **Violation**: Writing structures without a valid third-party Federated login or validated email provider.

### Payload 7: Immortal Creation Timestamp Override during Update
- **Path**: `/user_profiles/user_uid`
- **Payload**: `{ "createdAt": "2020-01-01T00:00:00Z" }`
- **Violation**: Trying to retroactively alter the established index timestamp for profile generation.

### Payload 8: Path Traversal Poisoning via Document Name
- **Path**: `/user_profiles/../../malicious-collection/doc`
- **Payload**: `{ "data": "hacked" }`
- **Violation**: Trying to exploit document path structures and escaping the secure matched workspace.

### Payload 9: Empty Document Schema Bypass
- **Path**: `/user_profiles/user_uid`
- **Payload**: `{}`
- **Violation**: Deleting or creating raw empty records without defining key properties.

### Payload 10: Multi-Field Update Gate Hijacking
- **Path**: `/user_profiles/user_uid`
- **Payload**: `{ "userId": "attacker_uid", "alias": "MODIFIED" }`
- **Violation**: Running an update action with a payload modifying critical immutable keys (`userId`) along with standard alias strings.

### Payload 11: Unauthenticated Database List Query (Scraping)
- **Action**: List `/user_profiles`
- **Auth state**: Unauthenticated
- **Violation**: Attempting to grab list indexes of user profile metrics to mine usernames and metadata.

### Payload 12: Phantom Admin Collection Write
- **Path**: `/admins/hacker_uid`
- **Payload**: `{ "userId": "hacker_uid", "isAdmin": true }`
- **Violation**: Writing to the restricted system admin overrides collection.

---

## 3. Test Runner

A security test suite is configured to run against the firestore emulator ruleset validating that every payload returns `PERMISSION_DENIED`.
