# odoo-hackathon-26_NOT_YOUR_TYPE
# AssetFlow Enterprise Asset & Resource Management System

AssetFlow is a workflow-first asset and shared resource management platform built for the Odoo Hackathon. It helps organizations manage departments, employees, physical assets, shared resources, allocations, transfers, maintenance approvals, audit cycles, notifications, and analytics from a single system instead of scattered spreadsheets and manual logs. [1]

The project is designed as an ERP-style system rather than a plain CRUD app. The architecture introduces organization boundaries, role-based access, state-driven workflows, conflict prevention, audit history, booking hold logic, and reporting foundations so the system can scale beyond a hackathon demo into a production-style design. [1]

## Problem It Solves

Organizations often struggle to answer simple operational questions such as: who currently holds an asset, which room is free, which resources are overdue, what is under maintenance, and which audit discrepancies still need action. AssetFlow turns those fragmented operations into traceable workflows with strong validation and centralized visibility. [1]

The system supports:
- Department and employee master setup
- Asset lifecycle tracking
- Allocation and transfer workflows
- Shared resource booking with overlap prevention
- Temporary booking holds for better UX
- Maintenance approval workflows
- Structured audit cycles
- Notifications, activity logs, and KPI dashboards [1]

## Key Capabilities

### Organization and Access
- Organization-scoped data model for future multi-tenant SaaS readiness. [1]
- Role-based access using `Role` and `UserRole` instead of a fixed single-role design. [1]
- Signup intended to create employee-level access only, while role elevation remains controlled by the system. [1]
- Session and idempotency support for safer enterprise workflows. [1]

### Asset Operations
- Asset registration with category, department, location, lifecycle state, condition, and ownership context. [1]
- Historical allocation ledger plus an active allocation lock model to prevent double allocation under concurrency. [1]
- Transfer requests with explicit workflow states instead of ad hoc reassignment. [1]
- Asset history and activity trails to support auditability. [1]

### Resource Booking
- Shared resource abstraction separated from assets so rooms and other bookable entities are modeled cleanly. [1]
- Booking statuses include held, confirmed, checked-in, completed, cancelled, and expired. [1]
- PostgreSQL exclusion constraints are used to prevent time-slot overlaps at the database level. [1]
- Temporary soft-hold support improves UX by reducing false availability during booking flows. [1]

### Maintenance and Audits
- Maintenance requests move through explicit states such as pending, approved, assigned, in repair, and resolved. [1]
- Audit cycles and audit records support scoped verification, discrepancy tracking, and post-close immutability protections. [1]
- Notifications and logs create an enterprise-grade operational trail. [1]

## Architecture Overview

AssetFlow follows a layered application design where API routes validate requests, service modules implement business rules, Prisma handles persistence, and PostgreSQL enforces critical integrity guarantees for concurrency and time-range conflicts. The repository already documents this as a backend-first ERP architecture rather than a screen-first prototype. [1]

### Architecture Principles
- **Workflow-first design:** business actions are modeled as controlled transitions, not just create/update/delete operations. [1]
- **Concurrency safety:** active allocation locks and database-level booking overlap protection reduce race conditions. [1]
- **Auditability:** activity logs, asset history, and immutable closed audit records preserve traceability. [1]
- **Scalability:** organization scoping, RBAC join tables, business rule configuration, and idempotency keys support future growth. [1]
- **Separation of concerns:** API routes, service logic, schema constraints, and reporting modules are cleanly divided. [1]

### High-Level Flow

```text
Client / Frontend
   ↓
Next.js API Route Layer
   ↓
Validation + Auth + RBAC + Idempotency
   ↓
Service Layer / Domain Modules
   ↓
Prisma ORM
   ↓
PostgreSQL Constraints + Transactions
```

This structure ensures that invalid operations are blocked in more than one place: first in application logic and then, for critical cases, at the database layer. That is especially important for double allocation prevention and overlapping booking protection. [1]

## Domain Model

The backend schema is built around explicit ERP entities instead of generic records. The core design includes organizations, users, departments, locations, assets, resources, allocations, transfers, bookings, maintenance requests, audit cycles, notifications, activity logs, and business rules. [1]

### Core Entities

| Entity | Purpose |
|---|---|
| `Organization` | Tenant boundary for all operational data. [1] |
| `Role`, `UserRole` | Flexible RBAC model for evolving permissions. [1] |
| `Department` | Hierarchical organizational structure. [1] |
| `Location` | Physical or operational location mapping for assets and resources. [1] |
| `AssetCategory` | Hierarchical classification for assets. [1] |
| `Asset` | Source of truth for tracked inventory. [1] |
| `Resource` | Bookable capacity abstraction, optionally linked to an asset. [1] |
| `AssetAllocation` | Historical allocation ledger. [1] |
| `ActiveAssetAllocation` | Concurrency guard for one active allocation per asset. [1] |
| `TransferRequest` | Managed reassignment flow. [1] |
| `ResourceBooking` | Shared resource booking records with time windows. [1] |
| `MaintenanceRequest` | Repair and approval workflow. [1] |
| `AuditCycle`, `AuditRecord` | Verification workflow for periodic audits. [1] |
| `Notification` | User-facing operational alerts. [1] |
| `ActivityLog`, `AssetHistory` | Traceability and timeline data. [1] |
| `BusinessRule` | Configurable policy settings such as hold duration and thresholds. [1] |
| `IdempotencyKey`, `Session` | Safe workflow retries and session tracking. [1] |

## Booking and Allocation Integrity

Two of the most important enterprise guarantees in AssetFlow are allocation exclusivity and booking overlap prevention. The repository architecture explicitly addresses both with stronger-than-CRUD controls. [1]

### Double Allocation Prevention
- `AssetAllocation` stores allocation history. [1]
- `ActiveAssetAllocation` acts as a lock table for the currently allocated asset. [1]
- Creating both in one transaction prevents two active allocations for the same asset. [1]
- A concurrency test script is included to verify that only one request succeeds under simultaneous allocation attempts. [1]

### Booking Overlap Prevention
- `ResourceBooking` stores booking windows in UTC. [1]
- Booking status values include `HELD` and `CONFIRMED`, enabling both soft-hold and final booking flows. [1]
- A PostgreSQL exclusion constraint prevents overlapping time ranges for active booking states. [1]
- This design is stronger than UI-only validation because the database itself rejects invalid overlaps. [1]

## Repository Structure

The current repository is organized around Prisma, modular domain services, and API endpoints. The inspected structure includes schema, migrations, service modules, route handlers, and a concurrency test utility. [1]

```text
.
├── README.md
├── docs/
│   └── architecture.md
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── scripts/
│   └── test-concurrency.ts
├── src/
│   ├── app/
│   │   └── api/
│   │       ├── assets/
│   │       ├── auth/
│   │       ├── bookings/
│   │       └── maintenance/
│   ├── lib/
│   │   └── db/
│   └── modules/
│       ├── assets/
│       ├── audit/
│       ├── auth/
│       ├── bookings/
│       ├── core/
│       ├── maintenance/
│       ├── organizations/
│       ├── reports/
│       └── users/
├── package.json
└── prisma.config.ts
```

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime / App | Next.js-style app routing structure with API routes. [1] |
| Language | TypeScript implied by repository structure and `.ts` modules. [1] |
| ORM | Prisma. [1] |
| Database | PostgreSQL. [1] |
| Validation | Zod and React Hook Form dependencies are present. [1] |
| Auth | JWT and session-oriented architecture are documented. [1] |
| UI Helpers | Lucide React, Sonner, CVA, Recharts dependencies are available. [1] |
| Media | Cloudinary dependency is included. [1] |

## Workflow Modules

### 1. Authentication and Access
The documented API includes signup, login, logout, and session handling, with signup intended to default to employee-level access only. Session tracking and role-based authorization are part of the architecture foundation. [1]

### 2. Asset Lifecycle
Assets move through explicit states such as available, reserved, allocated, under maintenance, lost, retired, and disposed. This supports realistic operational transitions and reporting. [1]

### 3. Allocation and Transfer
Allocations are historical records, while transfer requests provide controlled reassignment instead of unsafe direct overwrites. This makes holder changes auditable and easier to review. [1]

### 4. Shared Resource Booking
Resources can be bookable even when they are not assets, which is important for rooms and shared spaces. Booking status design supports hold-first flows, check-in progression, and expiry handling. [1]

### 5. Maintenance Workflow
Maintenance requests are modeled as workflow entities with approval and repair progress states. This gives the system operational depth beyond issue logging. [1]

### 6. Audit Cycle Management
Audit cycles and audit records support planned verification windows, assigned auditing, discrepancy outcomes, and immutability after closure. This mirrors enterprise governance workflows. [1]

## Database Guarantees

The architecture explicitly relies on PostgreSQL for protections that Prisma alone cannot fully model. The documented SQL layer includes time-order checks, booking overlap exclusion constraints, allocation return-time validation, audit cycle time checks, and a trigger that blocks updates to audit records after a cycle is closed. [1]

These guarantees are important because ERP systems cannot depend on frontend validation alone. Even if two requests arrive simultaneously or a client bypasses the UI, the database still protects business integrity. [1]

## Suggested Frontend Direction

A strong frontend for this backend should mirror the workflow-first nature of the architecture rather than flattening everything into generic forms. The most effective screens for a polished demo are a KPI dashboard, searchable asset directory, allocation conflict resolution flow, booking calendar with hold state, maintenance approval board, audit cycle manager, and notification center. [2][1]

Recommended frontend priorities:
- Role-based dashboard
- Asset directory and asset detail view
- Allocation and transfer modal flow
- Booking calendar with held vs confirmed states
- Maintenance approval board
- Audit cycle workspace
- Notifications and activity log panel [2][1]

## Getting Started

### Prerequisites
- Node.js
- npm
- PostgreSQL database
- Prisma CLI available through local dependencies [1]

### Installation

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

### Concurrency Test

The repository includes a script to validate atomic allocation locking under simultaneous requests. [1]

```bash
npx ts-node scripts/test-concurrency.ts
```

The intended success condition is exactly one successful allocation and all competing requests rejected as conflicts. [1]

## Roadmap

Short-term roadmap:
- Complete polished frontend screens for the documented workflows. [1][2]
- Wire dashboard, assets, bookings, maintenance, and audit APIs to the UI. [1]
- Add seed/demo data for a strong hackathon narrative. [1]
- Expose role-specific dashboards and notifications. [1][2]

Future roadmap:
- Production-ready file uploads and image management. [1]
- Full reporting and export workflows. [1]
- Rich availability calendar and booking hold countdown UX. [1]
- More advanced SLA, escalation, and maintenance intelligence. [1]
- Stronger test coverage across workflow transitions. [1]

## Why This Project Stands Out

AssetFlow is not just an inventory tracker. It is an ERP-style operations platform that combines asset lifecycle management, shared resource scheduling, concurrency-safe transactions, approval workflows, auditability, and configurable business rules into one coherent system. That makes it much more compelling than a typical hackathon CRUD app. [1]

## License

Add the project license here once the team finalizes it.
