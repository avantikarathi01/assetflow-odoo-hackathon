# AssetFlow Project Summary & System Logic

This document summarizes the current architecture, database schema, implemented backend features, detailed logic for asset allocations and resource bookings, and the roadmap for future development.

---

## 1. Database Schema Overview

The database uses PostgreSQL (managed via Neon Serverless Postgres) and is structured around a multi-tenant ERP design. Key entities include:

### Multi-Tenancy & Authorization
* **Organization**: The primary tenant boundary. All operational tables reference this model to enforce SaaS-like isolation.
* **Role, User, UserRole, Session**: Support for Role-Based Access Control (RBAC). A User belongs to an Organization and can have multiple Roles (e.g. `EMPLOYEE`, `ASSET_MANAGER`, `DEPARTMENT_HEAD`). Sessions handle token revocation.

### Core Assets & Resources
* **Asset**: Represents physical inventory (has `assetTag`, `serialNumber`, acquisition cost, status, condition, etc.).
* **Resource**: Separates bookable capacity from physical inventory (e.g. meeting rooms or shared spaces that aren't assets, or physical assets registered as bookable resources).
* **AssetFile**: Handles attachments/photos uploaded for assets.

### Workflows
* **AssetAllocation & ActiveAssetAllocation**: The historical allocation ledger and the active allocation lock.
* **TransferRequest**: Handles requests to transfer allocations between users/departments.
* **ResourceBooking**: Tracks time-slot reservations on resources (holds, confirmations, check-ins).
* **MaintenanceRequest**: Handles ticket workflows for asset repairs (Pending $\rightarrow$ Approved $\rightarrow$ Assigned $\rightarrow$ Repair $\rightarrow$ Resolved).
* **AuditCycle & AuditRecord**: Scoped cycles (by department/location) for auditors to verify asset presence and condition.

### System Auditing & Config
* **ActivityLog & AssetHistory**: Independent logs capturing actions for organization auditing and asset-specific timelines.
* **BusinessRule**: Dynamic policy keys (e.g. default return windows, booking hold timeouts).
* **IdempotencyKey**: Protects mutable POST routes from duplicated side-effects during retries.

---

## 2. Core Backend Features Implemented Till Now

1. **Framework Setup**: Standardized Next.js App Router workspace with TypeScript, type-safe API responses, and paths (`@/*` mapping to `./src/*`).
2. **Neon DB Schema**: Completely migrated Neon database with strict custom PostgreSQL constraints (triggers, checks, exclusion indexes).
3. **TypeScript Support**: Custom tsconfig configuration and `tsx` scripting compatibility.
4. **Asset & Allocation Service**: Core repository logic to register assets, track status updates, and execute atomic allocations.
5. **Booking & Availability Services**: Conflict check mechanics, soft-holds, validation buffers, and booking state machine.
6. **Maintenance & Audit Framework**: Service boundaries for raising requests and planning audit cycles.

---

## 3. Allocation & Booking Logic Details

### A. Asset Allocation & Concurrency Logic
* **Service Method**: `AllocationService.allocateAsset()`
* **Flow**:
  1. **Verification**: Checks if the asset is currently claimable using `AvailabilityService.isAssetClaimable()`. The asset status must be `AVAILABLE`, and it cannot be currently booked, under maintenance, or locked by another active allocation.
  2. **Transaction Boundary**: Starts a database `$transaction`:
     * **Create Allocation**: Inserts a new record into `AssetAllocation` with state `ACTIVE`.
     * **Create Lock (Atomicity)**: Attempts to insert a row containing `{ assetId, allocationId }` into the `ActiveAssetAllocation` table. Because `assetId` is the primary key (unique constraint), **only one concurrent transaction can succeed** at this step. If another thread allocates the asset simultaneously, this step throws a unique constraint violation error (`P2002`).
     * **Error Handling**: The service catches `P2002` and throws a custom `ConflictError` ("Asset is already allocated concurrently"), rolling back the transaction.
     * **Status Update**: Updates the physical asset status to `ALLOCATED` and increments the entity `version` (optimistic locking counter).
     * **History & Activity Logging**: Logs the action to `ActivityLog` and `AssetHistory`.

### B. Resource Booking & Buffer Overlap Logic
* **Service Method**: `BookingService.createBooking()`
* **Flow**:
  1. **Lazy Cleanup**: Cleans up expired soft-holds (where `status = HELD` and `holdExpiresAt < now`) by updating them to `EXPIRED`.
  2. **Asset Validation**: If the resource is mapped to a physical asset, verify the asset is claimable via `AvailabilityService`.
  3. **Duration Checking**: Ensures the booking duration fits between the resource's `minBookingMinutes` and `maxBookingMinutes`.
  4. **Padded Conflict Check**: Retrieves conflicting bookings taking resource buffer parameters into account. The system defines:
     * `paddedStart = requestedStart - bufferBeforeMinutes`
     * `paddedEnd = requestedEnd + bufferAfterMinutes`
     * It queries existing bookings where `status` is active (`HELD`, `CONFIRMED`, `CHECKED_IN`) and overlapping: `startAt < paddedEnd AND endAt > paddedStart`.
  5. **PostgreSQL Exclude Constraint (Fallback)**: When inserting the booking, a raw database exclusion constraint acts as a mathematical guarantee against overlaps (even in ultra-high concurrency):
     ```sql
     ALTER TABLE "ResourceBooking"
       ADD CONSTRAINT resource_booking_no_overlap
       EXCLUDE USING gist (
         "resourceId" WITH =,
         tstzrange("startAt", "endAt", '[)') WITH &&
       )
       WHERE ("status" IN ('HELD', 'CONFIRMED', 'CHECKED_IN'));
     ```
  6. **Soft-Hold Timeout**: Bookings are created in the `HELD` state. A hold expiration timestamp is set (`now + holdMinutes`). A separate check-in / confirm action is required to shift the booking to `CONFIRMED`.

---

## 4. Future Implementation Requirements (Roadmap)

To build a fully functional product, the following elements remain:
1. **Frontend Integration**: Building UI routes and page layouts under `src/app/` (since the workspace is currently only REST endpoints under `src/app/api`).
2. **Scheduling / Cron Jobs**: A background runner to automate the cleanups of expired holds and dispatch booking reminder notifications.
3. **Cloud Storage Connector**: Implementing a file storage adapter in `src/modules/core` to upload documents and photos directly to Cloudinary or AWS S3.
4. **Reports Aggregation Engine**: Advanced SQL queries to power booking heatmaps, department usage patterns, and asset depreciation logs.
