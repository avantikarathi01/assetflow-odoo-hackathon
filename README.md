# AssetFlow - Enterprise Asset & Resource Management System

AssetFlow is a workflow-first asset and shared resource management platform built for the Odoo Hackathon. It helps organizations manage departments, employees, physical assets, shared resources, allocations, transfers, maintenance approvals, audit cycles, notifications, and analytics from a single system instead of scattered spreadsheets and manual logs.

The project is designed as an **ERP-style system** rather than a plain CRUD app. The architecture introduces organization boundaries, role-based access control (RBAC), state-driven workflows, conflict prevention, audit history, booking hold logic, and reporting foundations so the system can scale beyond a hackathon demo into a production-style design.

## Problem It Solves

Organizations often struggle to answer simple operational questions such as: *who currently holds an asset, which room is free, which resources are overdue, what is under maintenance, and which audit discrepancies still need action.* AssetFlow turns those fragmented operations into traceable workflows with strong validation and centralized visibility.

The system supports:
- Department and employee master setup
- Asset lifecycle tracking
- Allocation and transfer workflows
- Shared resource booking with overlap prevention
- Temporary booking holds for better UX
- Maintenance approval workflows
- Structured audit cycles
- Notifications, activity logs, and KPI dashboards

## 🏗 System Architecture (Monorepo)

AssetFlow leverages a **strictly segregated full-stack monorepo architecture** (NPM Workspaces) to cleanly separate UI concerns from complex domain rules.

```text
.
├── backend/                  # Express.js REST API + Prisma ORM
│   ├── prisma/               # Schema and Migrations
│   ├── scripts/              # E2E test scripts
│   └── src/                  
│       ├── modules/          # Domain-Driven services (Auth, Assets, Audit, etc.)
│       ├── routes/           # Express API routers
│       └── server.ts         # Express server entry point
│
├── frontend/                 # Next.js 15 (App Router) + Tailwind CSS + shadcn/ui
│   ├── public/
│   ├── src/
│   └── next.config.ts        # API Proxy to backend
│
└── package.json              # Monorepo root
```

### High-Level Flow
```text
Client (Next.js UI)  -->  Frontend Server (/api proxy)  -->  Express.js Backend (Port 4000)
       ↓                                                             ↓
 User Actions            Validation + Auth + RBAC + Domain Logic + Atomic Locks
                                                                     ↓
                                                       PostgreSQL (Prisma ORM)
```

## 🚀 Key Capabilities

### Organization and Access
- **Multi-Tenant Ready:** Organization-scoped data model.
- **Robust RBAC:** Role-based access using `Role` and `UserRole` for granular permission control.
- **Security:** JWT authentication, session handling, and idempotency support for safe enterprise workflows.

### Asset Operations
- Asset registration with category, department, location, lifecycle state, condition, and ownership context.
- Historical allocation ledger plus an **active allocation lock model** to prevent double allocation under concurrency.
- Transfer requests with explicit workflow states instead of ad hoc reassignment.

### Resource Booking
- Shared resource abstraction separated from assets so rooms and other bookable entities are modeled cleanly.
- PostgreSQL **exclusion constraints** are used to prevent time-slot overlaps at the database level.
- Temporary **soft-hold** support improves UX by reducing false availability during booking flows.

### Maintenance and Audits
- Maintenance requests move through explicit states (pending, approved, assigned, in repair, resolved).
- Audit cycles support scoped verification, discrepancy tracking, and post-close immutability protections.

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend UI** | Next.js 15 (App Router), Tailwind CSS, shadcn/ui |
| **Backend API** | Express.js, Node.js |
| **Language** | TypeScript (Strict Mode) |
| **ORM & DB** | Prisma ORM & PostgreSQL |
| **Security** | bcryptjs, jsonwebtoken |
| **Package Manager**| NPM Workspaces |

## 💻 Getting Started

### Prerequisites
- Node.js (v18+)
- npm
- PostgreSQL database running locally or remotely

### 1. Installation
Clone the repository and install dependencies from the root directory. This will automatically install packages for both the `frontend` and `backend` workspaces.
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file inside the `/backend` directory:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/assetflow?schema=public"
JWT_SECRET="your_super_secret_jwt_key"
```

### 3. Database Setup
From the root directory, apply migrations and generate the Prisma client for the backend.
```bash
cd backend
npx prisma migrate dev
npx prisma generate
cd ..
```

### 4. Running the Application
You can run the entire full-stack application simultaneously from the root directory:
```bash
# Starts the Express API on http://localhost:4000
npm run dev:backend

# Starts the Next.js UI on http://localhost:3000
npm run dev:frontend
```

*Note: The Next.js frontend is configured to automatically proxy any requests made to `/api/*` over to the Express backend at `http://localhost:4000/api/*`.*

### 5. Testing Concurrency & RBAC
The backend comes with robust E2E validation scripts to test the integrity of atomic locks, roles, and complex cross-entity business rules.
```bash
cd backend
npx tsx scripts/test-e2e.ts
npx tsx scripts/test-roles.ts
```

## 📈 Roadmap

- **Frontend Dashboards:** Complete polished UI screens (KPIs, Asset Directory, Allocation Workflows).
- **Interactive Bookings:** Rich availability calendar and booking hold countdown UX.
- **Reporting:** Export workflows and advanced analytics.
- **Media Management:** Production-ready Cloudinary integration for asset images and condition reports.

## 🏆 Why AssetFlow Stands Out
AssetFlow is not just an inventory tracker. It is an **ERP-style operations platform** that combines asset lifecycle management, shared resource scheduling, concurrency-safe transactions, approval workflows, auditability, and configurable business rules into one coherent, scalable system. 

---
*Built for the Odoo Hackathon*
