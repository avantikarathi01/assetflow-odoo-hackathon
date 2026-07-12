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
    <li><a href="#key-features">Key Features</a></li>
    <li><a href="#system-architecture">System Architecture</a></li>
    <li><a href="#tech-stack">Tech Stack</a></li>
    <li><a href="#getting-started">Getting Started</a></li>
    <li><a href="#testing--validation">Testing & Validation</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
  </ol>
</details>

<br />

## 📖 About The Project

Organizations frequently struggle with fragmented operations: tracking who currently holds an asset, which meeting room is available, which equipment is overdue for maintenance, and which audit discrepancies require action. 

**AssetFlow** is engineered as a robust **ERP-style system** rather than a simple CRUD application. It turns fragmented workflows into strictly validated processes with centralized visibility. Designed for scale, it introduces multi-tenant organization boundaries, granular role-based access control (RBAC), conflict prevention, and immutable audit histories.

---

## ✨ Key Features

- **🏢 Organization & Access Management**
  - **Multi-Tenant Ready:** Fully scoped organizational data model.
  - **Granular RBAC:** Flexible roles (`Role`, `UserRole`) enabling tailored permissions without hardcoded limits.
  - **Enterprise Security:** JWT-based sessions, password hashing, and idempotency keys to ensure safe retries.

- **💻 Advanced Asset Operations**
  - Track asset lifecycles from registration (category, condition, location) to retirement.
  - **Atomic Concurrency Locks:** Prevent double-allocation of assets using transactional database locks.
  - Formal transfer workflows requiring approval, maintaining strict chain of custody.

- **📅 Shared Resource Booking**
  - Unified booking engine for non-asset shared resources (e.g., conference rooms).
  - **Database-Level Overlap Prevention:** PostgreSQL exclusion constraints definitively reject overlapping time windows.
  - **Soft-Hold State:** Enhances UX by temporarily reserving slots during checkout flows.

- **🛠 Maintenance & Auditing**
  - Complete maintenance approval workflows (pending → approved → in-repair → resolved).
  - Structured audit cycles for scheduled inventory verification with immutable post-close histories.

---

## 🏛 System Architecture

AssetFlow employs a **strictly segregated full-stack monorepo architecture** (NPM Workspaces) to cleanly separate UI concerns from complex domain rules.

```text
.
├── backend/                  # ⚙️ Express.js REST API + Prisma ORM
│   ├── prisma/               # Schema and DB Migrations
│   ├── scripts/              # E2E validation & RBAC testing
│   └── src/                  
│       ├── modules/          # Domain-Driven services (Auth, Assets, Audit)
│       ├── routes/           # Express API routers
│       └── server.ts         # Application entry point
│
├── frontend/                 # 🖥 Next.js 15 (App Router) + Tailwind CSS + shadcn/ui
│   ├── public/
│   ├── src/
│   └── next.config.ts        # Automated /api reverse proxy to Backend
│
└── package.json              # Monorepo configuration
```

> **Data Flow:** `Client (Next.js)` → `Frontend Proxy (/api)` → `Express Backend (4000)` → `Prisma` → `PostgreSQL`

---

## 🛠 Tech Stack

| Category | Technology |
| :--- | :--- |
| **Frontend** | [Next.js 15](https://nextjs.org/) (App Router), [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/) |
| **Backend** | [Express.js](https://expressjs.com/), [Node.js](https://nodejs.org/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (Strict Mode) |
| **Database & ORM** | [PostgreSQL](https://www.postgresql.org/), [Prisma](https://www.prisma.io/) |
| **Security & Auth** | `bcryptjs`, `jsonwebtoken` |
| **Architecture** | NPM Workspaces (Monorepo) |

---

## 🚀 Getting Started

Follow these steps to spin up the local development environment.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)
- A running instance of PostgreSQL.

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
DATABASE_URL="postgresql://user:password@localhost:5432/assetflow?schema=public"
JWT_SECRET="your_super_secret_jwt_key_here"
```

### 3. Database Migration
Apply the PostgreSQL schema and generate the Prisma client:
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
cd ..
```

### 4. Running the Application
AssetFlow can be run simultaneously from the root directory:
```bash
# Terminal 1: Starts the Express API on http://localhost:4000
npm run dev:backend

# Terminal 2: Starts the Next.js UI on http://localhost:3000
npm run dev:frontend
```
*Requests made to `/api/*` on the frontend are automatically proxied to the backend.*

---

## 🧪 Testing & Validation

The backend is strictly validated against race conditions and concurrent attacks. You can run our automated E2E and RBAC simulations to verify structural integrity:

```bash
cd backend

# Test core ERP workflows and Atomic Locks
npx tsx scripts/test-e2e.ts

# Test Organization Creation, Manager/Employee roles, and Permissions
npx tsx scripts/test-roles.ts
```

---

## 📈 Roadmap

- [x] **Frontend Dashboards:** Polish interactive KPI screens and Asset Directories.
- [x] **Interactive Bookings:** Build the rich availability calendar with real-time hold countdowns.
- [ ] **Advanced Reporting:** Export workflows, SLA escalation tracking, and maintenance analytics.
- [ ] **Media Management:** Integrate Cloudinary for condition-report images and avatar uploads.

---
<div align="center">
  <i>Built with ❤️ for the Odoo Hackathon</i>
</div>
