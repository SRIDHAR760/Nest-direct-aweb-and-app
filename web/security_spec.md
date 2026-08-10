# Security Specification & "Dirty Dozen" Rogue Payloads

This specification defines the Zero-Trust data invariants and outlines 12 rogue payloads designed to test and break the security boundaries of the NestDirect Firestore backend.

## 1. Data Invariants

1. **User Profiles (`/users/{userId}`)**:
   - Access to profile metadata (e.g., identity verification, favorites) is strictly restricted to the authentic owner (`userId == request.auth.uid`).
   - Standard users cannot arbitrarily escalate roles or set administrative privileges.

2. **Properties (`/properties/{propertyId}`)**:
   - Can be read by any visitor (public listings).
   - Can only be created, modified, or deleted by the authenticated owner of the listing.
   - Property document ID must match standard identifier constraints (`^[a-zA-Z0-9_\-]+$`).
   - Mandatory field size limits must be respected (e.g., titles, descriptions).
   - Critical audit fields like `ownerId` and `createdAt` must be completely immutable after creation.

3. **Inquiries (`/inquiries/{inquiryId}`)**:
   - Any verified tenant can submit/create an inquiry.
   - Inquiry state (`status`) is initialized to `pending` and can *only* be updated to `accepted` or `declined` by the verified owner of the referenced property.
   - Tenants cannot self-approve their own inquiries.

4. **Chat Messages (`/chat_messages/{messageId}`)**:
   - Messages are constrained to direct participants (the verified property owner or the inquiring tenant).
   - Immutability applies: chat histories cannot be maliciously altered or edited post-facto.

---

## 2. The "Dirty Dozen" Rogue Payloads

These 12 malicious payloads attempt to break the rules of Identity, Integrity, and State.

### Payload 1: Profile Spoofing
- **Target**: `/users/legit-user-123` (by attacker `evil-hacker-666`)
- **Intent**: Write custom favorites or verify KYC status on another user's profile.
```json
{
  "favorites": ["prop-1", "prop-2"],
  "isKycVerified": true
}
```

### Payload 2: Admin Privilege Escalation
- **Target**: `/users/attacker-uid` (creating own profile)
- **Intent**: Try to inject an unverified `role: "admin"` flag during creation to gain global write permissions.
```json
{
  "uid": "attacker-uid",
  "displayName": "Fake Admin",
  "email": "attacker@gmail.com",
  "role": "admin"
}
```

### Payload 3: Property ID Poisoning (Denial of Wallet)
- **Target**: `/properties/JUNK_CHARACTERS_THAT_ARE_1000_BYTES_LONG_...`
- **Intent**: Attempt to inject massive junk-character strings as document paths to trigger query cost explosions.

### Payload 4: Overwriting Someone Else's Property Listing
- **Target**: `/properties/luxury-penthouse-omr` (owned by owner `karthik-77`)
- **Intent**: An unauthenticated attacker attempts to update or delete Karthik's listing.
```json
{
  "title": "Hacked Penthouse (Price is now 0)",
  "price": 0
}
```

### Payload 5: Altering Immobilized Creation Audits
- **Target**: `/properties/my-own-villa`
- **Intent**: A property owner attempts to update the `createdAt` timestamp or re-assign `ownerId` to someone else.
```json
{
  "ownerId": "victim-user-uid",
  "createdAt": "2020-01-01T00:00:00Z"
}
```

### Payload 6: Inquiry Status Auto-Approval
- **Target**: `/inquiries/my-new-visit-request` (submitted by tenant `alex-mercer`)
- **Intent**: Tenant attempts to bypass landlord review and create the inquiry with `status: "accepted"` directly.
```json
{
  "id": "my-new-visit-request",
  "propertyId": "prop-1",
  "tenantName": "Alex Mercer",
  "status": "accepted"
}
```

### Payload 7: Self-Approval of Sibling Inquiry
- **Target**: `/inquiries/victim-visit-request`
- **Intent**: A random logged-in user attempts to update the status of another tenant's inquiry to `"accepted"`.
```json
{
  "status": "accepted"
}
```

### Payload 8: Message History Alteration (Gaslighting)
- **Target**: `/chat_messages/msg-start-1`
- **Intent**: Changing the text of an already sent chat message from "When would you like to tour?" to "I agree to sell you the building for ₹100."
```json
{
  "text": "I agree to sell you the building for ₹100."
}
```

### Payload 9: Denial of Wallet Payload Volumetric Attack
- **Target**: `/properties/any-prop`
- **Intent**: Create a listing where the title string is 10 megabytes of repeating characters to exhaust database storage space.

### Payload 10: Email Spoofing Attack
- **Target**: Administrative/Owner read functions
- **Intent**: Logging in with an unverified email token (`email_verified: false`) and attempting to read private tenant contact details.

### Payload 11: Non-Owner inquiry extraction scraping
- **Target**: `/inquiries` list query
- **Intent**: A general visitor querying all inquiries in Chennai to scrape tenant phone numbers and email addresses without authorization.

### Payload 12: Orphaned Entity Registration
- **Target**: `/inquiries/orphan-inquiry`
- **Intent**: Submitting an inquiry referencing a completely non-existent property ID (`propertyId: "fake-non-existent-id"`) to clutter the active database queues.

---

## 3. Test Verification Blueprint

Our hardened `firestore.rules` will be evaluated against these 12 malicious scenarios. All of them must return `PERMISSION_DENIED` to maintain absolute zero-trust integrity.
