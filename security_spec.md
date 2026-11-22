# Security Specification - AddonForge AI

## Data Invariants
1. A **Project** must belong to a specific `userId`.
2. A **Project**'s `id` must be unique and immutable.
3. A **CommunityAddon** must reference a valid `projectId`.
4. A **CommunityAddon** must have an `expiresAt` timestamp exactly 3 days after `createdAt`.
5. Users can only edit or delete their own projects.
6. Community addons are publicly readable but only deletable by the author (before expiration).

## The Dirty Dozen (Attacker Payloads)

1. **Identity Theft (Project)**: Attempt to create a project with a `userId` that is not mine.
2. **Ghost Field (Project)**: Attempt to inject `isAdmin: true` into a project document.
3. **Price Poisoning (N/A)**: (No payments in this app).
4. **Relational Orphan**: Create a `CommunityAddon` for a `projectId` that I don't own.
5. **Eternal Broadcast**: Set `expiresAt` to 10 years in the future for a community addon.
6. **Shadow Update (Project)**: Update a project's `files` but also try to change the `ownerId`.
7. **Size Attack**: Try to save a 2MB string as the `name` of a project.
8. **ID Poisoning**: Use a document ID containing malicious characters like `../../etc/passwd`.
9. **Blanket Read (Community)**: Try to list all community addons without an authenticated session.
10. **Spoof Author**: Create a community addon with someone else's `authorName`.
11. **Premature Update**: Update a project's `updatedAt` to a future timestamp.
12. **Mass Deletion**: Attempt to delete community addons that I didn't create.

## Test Strategy
- Verify that `isValidId` blocks malformed IDs.
- Verify that `isValidProject` and `isValidCommunityAddon` enforce required fields and types.
- Verify that `update` operations use `affectedKeys().hasOnly()` to prevent unauthorized field modifications.
