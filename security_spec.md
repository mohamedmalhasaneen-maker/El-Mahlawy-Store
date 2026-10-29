# Security Specification — المحلاوي ستور (El Mahlawy Store)

## 1. Master Source of Truth & Data Invariants

1. **Public Read Isolation**:
   - Unauthenticated shoppers can `get` or `list` `/products/{productId}` documents **only** when `resource.data.isPublished == true`. Hidden/unpublished products (`isPublished == false`) are strictly restricted to the verified authorized developer.
   - Public shoppers can `get` `/siteConfig/main` (public storefront display & business contact configuration, containing zero secrets or private user PII) so changes saved by the developer immediately appear to all visitors. Collection `list` on `/siteConfig` is strictly forbidden (`allow list: if false`).
   - `/test/connection` supports read-only single-document `get` (`probeId == 'connection'`) strictly for client connectivity health probing; `list`, `create`, `update`, and `delete` are forbidden.
   - `/admins/{adminUid}` cannot be listed, created, updated, or deleted from any client interface (`allow list, create, update, delete: if false`), and `get` is restricted strictly to the verified authorized developer.
2. **Multi-Developer Zero-Trust Gate (Immutable UIDs + Verified Owner Emails)**:
   - No client-side password, UID string input, or unverified claim is trusted. Only a real Firebase Authentication session whose server-signed `request.auth.uid` matches an authorized developer UID (`'eGi5P37ztLe5Nn77sEFvmFFcZWp1'` for Primary Store Developer or `'ILSbnyLsRWXvV9n2viqoMgFyDpr2'` for Infinity Corp Developer, regardless of `email_verified` flag) OR a verified owner email (`abdulazizriadvip@gmail.com` / `companycamerasinfinitycorp@gmail.com` / `mohamed.m.alhasaneen@gmail.com` strictly with `'email_verified' in request.auth.token && request.auth.token.email_verified == true`) may read unpublished products, create/update/delete `/products/{productId}`, or write `/siteConfig/main`.
   - Public frontend sign-up (`createUserWithEmailAndPassword`) and client-side privilege creation (`/admins` writes) are strictly prohibited.
3. **Strict Schema, Key Whitelisting & CEL Expression Budget (<1,000 Limit)**:
   - Every write to `/products/{productId}` and `/siteConfig/{configId}` enforces exact `hasAll` and `hasOnly` field sets, string `.size()` bounds (`category` 0..80, `categoryId` 0..60), bounded list sizes (`images` 1..15, `specs` 0..15, `options` 0..10, `contactChannels` 0..20, `socialLinks` 0..15, `branches` 0..10, `categories` 1..20 ordered maps `{ id, name, order }`), and regex ID constraints (`^[a-zA-Z0-9_\-]+$`).
   - `/siteConfig/main` writes always persist the complete sanitized 51-key `SiteConfig` document (matching `/products/{productId}` full-document writes) and validate fields via compact `isStr`/`isReqStr` primitives so total evaluated CEL expressions remain well below Cloud Firestore's 1,000-expression hard limit per request.
4. **Pricing & Discount Integrity**:
   - `price > 0`, `originalPrice >= price`, and whenever `discountEnabled == true`, `originalPrice > price` must hold. Optional `discountType` must be `'percentage'` or `'fixed'`, and `discountValue >= 0`.
5. **Immutable Provenance & Server Timestamps**:
   - On `/products/{productId}`, `id`, `authorUid`, and `createdAt` are immutable after creation (while allowing legacy cloud documents lacking those metadata fields to be upgraded to full schema by any verified developer, and allowing either authorized developer to update products created by the other while preserving original `authorUid` and `createdAt`). `createdAt` on create and `updatedAt` on create/update must equal `request.time`.
   - On `/siteConfig/main`, `id` is locked to `'main'`, `updatedBy` must equal `request.auth.uid`, `updatedAt` must equal `request.time`, and `delete` is forbidden.
6. **Zero DB Lookups in `list` Queries**:
   - `allow list` on `/products/{productId}` evaluates `resource.data.isPublished == true` or pure token/UID-based `isAuthorizedDeveloper()`, avoiding any `get()`/`exists()` inside list rules. `/admins/{adminUid}`, `/siteConfig/{configId}`, `/meta/{statId}`, and `/test/{probeId}` forbid `list` entirely.

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Shadow Field Injection on Product**: Valid product payload plus `"isSuperFeatured": true` -> Rejected by `keys().hasOnly(...)`.
2. **Email Spoofing (Unverified Developer Email with Non-Developer UID)**: Token with `uid == "spoof-uid-999"`, `email == "abdulazizriadvip@gmail.com"` or `"companycamerasinfinitycorp@gmail.com"`, and `email_verified == false` -> Rejected by `isAuthorizedDeveloper()`.
3. **Non-Developer Authenticated Write**: Verified regular user (`attacker@example.com`, `uid == "regular-user-1"`) attempts to create a product or update `/siteConfig/main` -> Rejected by `isAuthorizedDeveloper()`.
4. **Identity Spoofing (`authorUid` / `updatedBy` mismatch)**: Developer creates product with `authorUid: "other-user"` or updates `/siteConfig/main` with `updatedBy: "other-user"` -> Rejected by `request.auth.uid` check.
5. **ID Poisoning**: Creating `/products/bad$id with spaces!` or `/siteConfig/rogue-doc` -> Rejected by `isValidId()` and `configId == 'main'`.
6. **Discount Inversion Attack**: `discountEnabled: true`, `price: 3000`, `originalPrice: 2500` -> Rejected by `originalPrice > price` check.
7. **Zero/Negative Price Attack**: `price: 0` or `price: -50` -> Rejected by `data.price > 0`.
8. **Denial-of-Wallet Unbounded Array**: `images` array with 25 items or `socialLinks` with 20 items -> Rejected by `.size() <= MAX`.
9. **Value Poisoning on Update**: Updating `name` or `storeName` to boolean `true` or oversized string -> Rejected because `isValidProduct(incoming())` / `isValidSiteConfig(incoming())` wraps the entire `allow update` block.
10. **Immutable Field Tampering**: Updating `authorUid` or `createdAt` on an existing product -> Rejected by immutability guards.
11. **Client Timestamp Forgery**: Providing a forged client timestamp (`2099-01-01T00:00:00.000Z`) instead of `request.time` -> Rejected by `incoming().updatedAt == request.time`.
12. **Privilege Escalation / Extra Developer Account Creation**: Any user attempting `create` on `/admins/new-dev-uid`, writing `/test/connection`, or reading unpublished `/products` without verified developer credentials -> Rejected by `allow create: if false` and `existing().isPublished == true || isAuthorizedDeveloper()`.
