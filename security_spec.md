# Security Specification — المحلاوي ستور (El-Mahallawy Store)

## 1. Master Source of Truth & Data Invariants

1. **Public Read Isolation**: Unauthenticated shoppers can only `get` or `list` `/products/{productId}` documents where `resource.data.isPublished == true`. Draft or unpublished products are strictly restricted to verified administrators.
2. **Zero-Trust Admin Gate**: Only verified administrators (`mohamed.m.alhasaneen@gmail.com` with `email_verified == true` or verified users with an existing document in `/admins/{uid}`) may create, update, or delete products or grant admin roles.
3. **Strict Schema & Key Whitelisting**: Every write to `/products/{productId}` or `/admins/{adminUid}` enforces exact `hasAll` and `hasOnly` field sets, string length limits, bounded array sizes (`images` 1..8, `specs` 0..15, `options` 0..10), and regex ID constraints (`^[a-zA-Z0-9_\-]+$`).
4. **Pricing & Discount Integrity**: `price > 0`, `originalPrice >= price`, and whenever `discountEnabled == true`, `originalPrice > price` must hold.
5. **Immutable Provenance & Server Timestamps**: `id`, `authorUid`, and `createdAt` cannot be modified after creation. `createdAt` on create and `updatedAt` on create/update must equal `request.time`.
6. **Zero DB Lookups in `list` Queries**: `allow list` on `/products/{productId}` evaluates `resource.data.isPublished == true` or token-based `isBootstrappedAdmin()`, avoiding any `get()`/`exists()` inside list rules. `/admins/{adminUid}` forbids `list` entirely.

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Shadow Field Injection**: Valid product payload plus `"isSuperFeatured": true` -> Rejected by `keys().hasOnly(...)`.
2. **Email Spoofing (Unverified Admin Email)**: Token with `email == "mohamed.m.alhasaneen@gmail.com"` and `email_verified == false` -> Rejected by `email_verified == true`.
3. **Self-Assigned Admin Escalation**: Regular user writes `/admins/{theirUid}` -> Rejected because `allow create` on `/admins` requires `isBootstrappedAdmin()`.
4. **Identity Spoofing (`authorUid` mismatch)**: Admin creates product with `authorUid: "someone_else"` -> Rejected by `incoming().authorUid == request.auth.uid`.
5. **ID Poisoning (1.5KB Junk Path ID)**: Creating `/products/bad$id!with spaces` -> Rejected by `isValidId(productId)`.
6. **Discount Inversion Attack**: `discountEnabled: true`, `price: 1500`, `originalPrice: 1200` -> Rejected by `originalPrice > price` check.
7. **Zero/Negative Price Attack**: `price: 0` or `price: -50` -> Rejected by `data.price > 0`.
8. **Denial-of-Wallet Unbounded Array**: `images` array with 25 items -> Rejected by `data.images.size() <= 8`.
9. **Value Poisoning on Update**: Updating `name` to a boolean `true` or 50KB string -> Rejected because `isValidProduct(incoming())` wraps the entire `allow update` block.
10. **Immutable Field Tampering**: Updating `createdAt` or `authorUid` on an existing product -> Rejected by `incoming().createdAt == existing().createdAt && incoming().authorUid == existing().authorUid`.
11. **Client Timestamp Forgery**: Providing a past/future timestamp instead of `serverTimestamp()` (`request.time`) -> Rejected by `incoming().updatedAt == request.time`.
12. **Unpublished Catalog Scraping**: Unauthenticated `list` query without `where('isPublished', '==', true)` -> Rejected by `existing().isPublished == true`.
