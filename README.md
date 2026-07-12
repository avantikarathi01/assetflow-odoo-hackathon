<div align="center">
  <br />
  <h1>🏢 AssetFlow</h1>
  <p>
    <strong>Enterprise Asset & Resource Management System</strong>
  </p>
  <p>
    A workflow-first platform built for the Odoo Hackathon to seamlessly manage assets, shared resources, and complex operational lifecycles.
  </p>

  <div>
    <img src="https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next JS" />
    <img src="https://img.shields.io/badge/Express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB" alt="Express.js" />
    <img src="https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white" alt="Prisma" />
    <img src="https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white" alt="Postgres" />
    <img src="https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  </div>
</div>

<br />

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#about-the-project">About The Project</a></li>
    <li><a href="#key-features--functionalities">Key Features & Functionalities</a></li>
    <li><a href="#tech-stack">Tech Stack</a></li>
    <li><a href="#system-architecture">System Architecture</a></li>
    <li><a href="#folder-structure">Folder Structure</a></li>
    <li><a href="#database-design--schema">Database Design & Schema</a></li>
    <li><a href="#backend-api-overview">Backend API Overview</a></li>
    <li><a href="#getting-started--local-setup">Getting Started & Local Setup</a></li>
    <li><a href="#testing--validation">Testing & Validation</a></li>
  </ol>
</details>

---

## 📖 About The Project

Organizations frequently struggle with fragmented operations: tracking who currently holds an asset, which meeting room is available, which equipment is overdue for maintenance, and which audit discrepancies require action. 

**AssetFlow** is engineered as a robust **ERP-style system** rather than a simple CRUD application. It turns fragmented workflows into strictly validated processes with centralized visibility. Designed for scale, it introduces multi-tenant organization boundaries, granular role-based access control (RBAC), conflict prevention, and immutable audit histories.

---

## ✨ Key Features & Functionalities

- **🏢 Organization & Access Management**
  - **Multi-Tenant Architecture:** Fully scoped organizational data model. One database powers multiple isolated organizations.
  - **Granular RBAC:** Flexible roles (`ADMIN`, `MANAGER`, `EMPLOYEE`) driving custom portal views and API-level permission gates.
  - **Real-Time Dashboards:** Role-specific KPIs. Admins see global metrics; employees see personal assets and schedules.

- **💻 Advanced Asset Operations**
  - **Lifecycle Tracking:** Track assets from registration to retirement. Manage categories, conditions, locations, and departments.
  - **Atomic Concurrency Locks:** Prevent double-allocation of assets using transactional database locks.
  - **Transfer Workflows:** Employees can request assets (even if currently allocated). Managers approve/reject requests, maintaining strict chain of custody.

- **📅 Shared Resource Booking**
  - **Unified Booking Engine:** Manage non-asset shared resources (e.g., conference rooms, company vehicles).
  - **Conflict Prevention:** Database-level overlap constraints definitively reject overlapping time windows.

- **🛠 Maintenance & Auditing**
  - **Maintenance Ticketing:** Complete maintenance approval workflows (Pending -> Approved -> In-Repair -> Resolved).
  - **Scheduled Audits:** Structured audit cycles for inventory verification with immutable post-close histories.

- **🔔 Live Notifications & Activity Stream**
  - System-wide activity logs track every creation, update, and deletion.
  - Real-time in-app notification center alerts users to transfer approvals, rejected bookings, and overdue items.

---

## 🛠 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | [Next.js 15](https://nextjs.org/) (App Router), React, [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), Lucide Icons |
| **Backend** | [Express.js](https://expressjs.com/), [Node.js](https://nodejs.org/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (Strict Mode) across the entire stack |
| **Database & ORM** | [PostgreSQL](https://www.postgresql.org/) (Neon DB), [Prisma ORM](https://www.prisma.io/) |
| **Security & Auth** | `bcryptjs` (password hashing), `jsonwebtoken` (stateless JWT authentication) |
| **Architecture** | NPM Workspaces (Monorepo) |

---

## 🏛 System Architecture

AssetFlow employs a **strictly segregated full-stack monorepo architecture** to cleanly separate UI concerns from complex domain rules. 

> **Data Flow:** `Client (Next.js)` -> `Frontend Proxy (Next API routes)` -> `Express Backend (Port 4000)` -> `Prisma ORM` -> `PostgreSQL`

By using an Express backend separate from Next.js Server Actions, AssetFlow can scale its API independently, easily support future mobile applications, and run background worker jobs (like chron-based maintenance reminders) without tying up the web server.

---

## 📁 Folder Structure

```text
assetflow-odoo-hackathon/
├── package.json              # Monorepo configuration (NPM Workspaces)
├── backend/                  # ⚙️ Express.js REST API
│   ├── prisma/               
│   │   └── schema.prisma     # Database schema & relationships
│   ├── scripts/              # Seed scripts & DB testing utilities
│   ├── src/                  
│   │   ├── core/             # Error handling & middleware
│   │   ├── jobs/             # Scheduled background tasks (cron)
│   │   ├── lib/              # Prisma client & shared utilities
│   │   ├── modules/          # Domain-Driven services (Assets, Auth, Bookings)
│   │   ├── routes/           # Express API routers (Endpoints)
│   │   └── server.ts         # Application entry point (Port 4000)
│
├── frontend/                 # 🖥 Next.js UI Application
│   ├── src/
│   │   ├── app/              # Next.js App Router (Pages, Layouts)
│   │   ├── components/       # Reusable UI (Forms, Modals, shadcn components)
│   │   └── lib/              # Client API fetchers, Auth Context, Utils
│   └── next.config.ts        # Automated /api reverse proxy to Backend
```

---

## 🗄 Database Design & Schema

The database is built on **PostgreSQL** and managed via **Prisma**. It is highly relational and designed to enforce data integrity.

### Core Entities
1. **Organization:** The root tenant. All records belong to an Organization.
2. **User & Role:** Users belong to an organization and have assigned Roles (`UserRole`) dictating their permissions.
3. **Asset & AssetCategory:** Represents physical trackable items. Assets can be assigned to `Locations` and `Departments`.
4. **AssetAllocation & ActiveAssetAllocation:** Tracks who currently possesses an asset. `ActiveAssetAllocation` acts as a unique constraint to prevent double-booking.
5. **TransferRequest:** Manages the workflow of moving an asset from one user/department to another.
6. **Resource & ResourceBooking:** Represents bookable entities (rooms, vehicles) and their time-based reservations.
7. **MaintenanceRequest:** Tickets raised against Assets for repair.
8. **AuditCycle & AuditRecord:** Batched inventory verification records.
9. **ActivityLog & Notification:** Immutable event sourcing for the dashboard activity stream and user-specific alerts.

---

## 🔌 Backend API Overview

The backend exposes a comprehensive RESTful API. All routes are prefixed with `/api` and (mostly) require a valid JWT Bearer token.

| Domain | Routes | Purpose |
| :--- | :--- | :--- |
| **Auth** | `POST /auth/login`, `POST /auth/register` | Authentication, JWT issuance |
| **Dashboard** | `GET /dashboard` | Fetches KPIs, upcoming events, and Activity Stream |
| **Assets** | `GET /assets`, `POST /assets`, `GET /assets/:id` | Asset CRUD, filtering, searching |
| **Allocations** | `POST /allocations`, `POST /allocations/:id/return` | Assigning assets to users & returning them |
| **Transfers** | `GET /transfers`, `POST /transfers`, `POST /transfers/:id/approve` | Requesting assets and manager approval workflows |
| **Bookings** | `GET /bookings`, `POST /bookings` | Reserving shared resources |
| **Maintenance** | `GET /maintenance`, `POST /maintenance` | Raising and managing repair tickets |
| **Activity** | `GET /activity-logs`, `GET /notifications` | Fetching system logs and user alerts |

---

## 🚀 Getting Started & Local Setup

Follow these steps to spin up the local development environment from scratch.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)
- A running instance of PostgreSQL (Local or Cloud like Neon/Supabase)

### 1. Installation
Clone the repository and install all workspace dependencies from the root directory:
```bash
git clone https://github.com/avantikarathi01/assetflow-odoo-hackathon.git
cd assetflow-odoo-hackathon
npm install
```

### 2. Environment Variables
Create a `.env` file in the `/backend` directory:
```env
# /backend/.env
DATABASE_URL="postgresql://user:password@localhost:5432/assetflow?schema=public"
JWT_SECRET="your_super_secret_jwt_key_here"
```

### 3. Database Migration & Seeding
Apply the PostgreSQL schema, generate the Prisma client, and populate demo data:
```bash
cd backend
npx prisma generate
npx prisma db push
npx tsx scripts/seed-existing.ts
cd ..
```
*(The seed script generates a demo organization, admins, employees, assets, and active allocations so you can immediately test the dashboards).*

### 4. Running the Application
AssetFlow utilizes NPM Workspaces, allowing you to run both servers concurrently from the root, or in separate terminals.

**Terminal 1 (Backend):** Starts the Express API on port `4000`.
```bash
npm run dev:backend
```

**Terminal 2 (Frontend):** Starts the Next.js UI on port `3000`.
```bash
npm run dev:frontend
```

Once running, navigate to [http://localhost:3000](http://localhost:3000) in your browser. 
*(Note: Frontend requests made to `/api/*` are automatically proxied to the backend on port 4000 via `next.config.ts`).*

---

## 🧪 Testing & Validation

The backend is strictly validated against race conditions, overlapping bookings, and concurrent attacks. You can run our automated testing scripts to verify structural integrity:

```bash
cd backend

# Test core ERP workflows and Atomic Locks
npx tsx scripts/test-e2e.ts

# Test Organization Creation, Manager/Employee roles, and Permissions
npx tsx scripts/test-roles.ts
```

---
<div align="center">
  <i>Built with ❤️ for the Odoo Hackathon</i>
</div>
