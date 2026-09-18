# 🚀 DigiTopper Project Tracker & Execution Engine

> **Enterprise EdTech Project Lifecycle, Multi-School Onboarding, and Hardware-Content Rollout Management System**  
> An integrated platform designed to bridge business operations, institutional procurement, physical hardware logistics, digital curriculum QA, field installations, teacher training, and financial project closure.

---

## 📑 Table of Contents

1. [System Architecture & Technology Stack](#-system-architecture--technology-stack)
2. [End-to-End Workflow Engine (Stages 01–08)](#-end-to-end-workflow-engine-stages-0108)
3. [Dashboard Integration & Data Synchronization](#-dashboard-integration--data-synchronization)
4. [Multi-School & Branch Architecture](#-multi-school--branch-architecture)
5. [Hardware Stock, Procurement & Logistics Engine](#-hardware-stock-procurement--logistics-engine)
6. [Role-Based Access Control (RBAC) & Security](#-role-based-access-control-rbac--security)
7. [Database Schema & Data Models](#-database-schema--data-models)
8. [API Reference & Swagger Endpoints](#-api-reference--swagger-endpoints)
9. [Installation, Environment Setup & Seeding](#-installation-environment-setup--seeding)
10. [Pre-configured Test Credentials](#-pre-configured-test-credentials)
11. [Project Directory Structure](#-project-directory-structure)

---

## 🏗️ System Architecture & Technology Stack

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       DIGITOPPER PROJECT TRACKER                                       │
├───────────────────────────────────────────────────┬────────────────────────────────────────────────────┤
│                  FRONTEND CLIENT                  │                  BACKEND REST API                  │
│  - Framework: Next.js 14 (App Router)             │  - Runtime: Node.js (v18+) & Express.js 4.19       │
│  - Language: TypeScript (Strict Type Safety)      │  - Database: MongoDB Atlas (Mongoose ODM v8.3)     │
│  - Styling: TailwindCSS + Glassmorphism           │  - Security: Helmet, CORS, Express Rate Limit      │
│  - State Management: React Context + Custom Hooks │  - Authentication: JWT (Access & Refresh Tokens)   │
│  - Dynamic Engine: JSON-Schema Form Renderer      │  - File Uploads: Multer with Local Storage Engine  │
│  - Icons: Lucide React (Tree-shakeable)           │  - API Documentation: Swagger UI Express + YAML    │
└───────────────────────────────────────────────────┴────────────────────────────────────────────────────┘
                                                    ▲
                                                    │ (REST / Seeder Migration Layer)
┌───────────────────────────────────────────────────┴────────────────────────────────────────────────────┐
│                                   DIGITOPPER DASHBOARD (SOURCE)                                        │
│  - MongoDB Deployed Backend: Organizations, Projects, Schools, Platform Licenses (IFP, Tablet, Win)   │
│  - Endpoints: GET /api/projects/list, GET /api/schools?projectId=:id, GET /api/schools/:schoolId       │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🗺️ End-to-End Workflow Engine (Stages 01–08)

The Project Tracker structures institutional rollouts into an 8-stage linear & branching pipeline defined in `backend/src/config/timeline.js`:

```
[01 LEAD & NEGOTIATION] ──> [02 PO & PI] ──> [03 ORDER REQUIREMENT]
                                                    │
                                                    ▼
                                            [04 EXECUTION]
                                      ┌─────────────┼─────────────┐
                                      ▼             ▼             ▼
                                 [HARDWARE]      [TECH]       [CONTENT]
                                 (Stock/PO)   (Build/APKs)   (QA/Sheets)
                                      └─────────────┬─────────────┘
                                                    ▼
                                    [05 TECH + CONTENT TESTING]
                                                    │
                                                    ▼
                                           [06 INSTALLATION]
                                                    │
                                                    ▼
                                            [07 TRAINING]
                                                    │
                                                    ▼
                                         [08 PROJECT CLOSURE]
```

### Stage Summary Details:

1. **`01 — LEAD_AND_NEGOTIATION`**
   - Captures prospective client details, lead source (RFP/Tender/Direct), estimated project valuation (₹), and negotiation confirmation status.
2. **`02 — PO_AND_PI`**
   - Purchase Order (PO) PDF upload, Work Order numbering, Proforma Invoice (PI) generation, GST percentage calculation, and payment terms definition.
3. **`03 — ORDER_REQUIREMENT`**
   - **School Information**: Multi-branch onboarding (campus locations, UDISE code, principal/coordinator contacts, student counts).
   - **Solution Selection**: Modular configuration of `STEM_LAB`, `ROBOTICS`, `SMART_SHAALA`, `ASTRONOMY`, `LANGUAGE_LAB`, `EPATHSHALA`, `SCIENCE_LEARNING`.
   - **Hardware Requirements**: Detailed product selection (IFP Panels, Tablets, Mini PCs, Routers, Charging Carts) and quantity breakdown.
4. **`04 — EXECUTION` (Parallel 3-Branch Stream)**
   - **Hardware Stream**: Warehouse stock verification (`REQ_AND_STOCK_CHECK`), automated procurement deficit calculation (`PURCHASE_IF_NEEDED`), per-product courier docket tracking (`CONSIGNMENT_TRACKING`), and physical verification sign-off (`HARDWARE_READY`).
   - **Tech Stream**: Build creation, school license allocation verification, APK build upload, and sandbox testing.
   - **Content Stream**: Board, language, and curriculum set configuration, QA review, sheet readiness, and master dump generation.
5. **`05 — TECH_AND_CONTENT_TESTING`**
   - Gate check requiring `TECH_READY` and `CONTENT_READY`. Verification across physical target environments (Android Tablets, Smartboards, PC Desktops).
6. **`06 — INSTALLATION`**
   - Field engineer scheduling, campus delivery confirmation, physical mounting & wiring, site testing, and signed installation report upload.
7. **`07 — TRAINING`**
   - Teacher and administrator training sessions (Online/Offline/Hybrid), participant attendance recording, topics checklist, and signed feedback report.
8. **`08 — PROJECT_CLOSURE`**
   - Final institutional sign-off, client satisfaction score, payment milestone ledger (Total/Paid/Pending amounts), and formal project handover archiving.

---

## 🔄 Dashboard Integration & Data Synchronization

The Project Tracker natively integrates with the existing **DigiTopper Dashboard** backend:

### Model & Field Level Mapping Table

| Dashboard Entity (`dashboard/src/models/`) | Tracker Entity (`backend/src/modules/`) | Transformation & Target Mapping |
| :--- | :--- | :--- |
| `Project.projectId` (`PRJ-DASH-001`) | `Project.projectId` | Primary alphanumeric code, indexed & uppercase |
| `Project.projectName` | `Project.projectName` | Full human-readable project title |
| `Project.orgId` (Organization) | `Project.organization` & `Requirement.leadAndNegotiation.organizationName` | Organization name & issuing organization |
| `Project.email`, `Project.phone` | `Requirement.leadAndNegotiation.email`, `phone` | Master institutional contact channels |
| `School.name` | `Requirement.orderRequirement.schoolInformation.schools[].schoolName` | Multi-School Switcher Tab label |
| `School.schoolId` | `Requirement.orderRequirement.schoolInformation.schools[].schoolCode` | School UDISE / Branch Code |
| `School.address`, `cityId`, `stateId` | `Requirement.orderRequirement.schoolInformation.schools[].address` | Campus location and physical address |
| `School.numberOfStudents` | `Requirement.orderRequirement.schoolInformation.schools[].totalStudents` | Branch student capacity (Aggregated in banner) |
| `School.coordinatorId` / Contact | `Requirement.orderRequirement.schoolInformation.schools[].contactPerson` | On-site coordinator / principal name |

### Platform-to-Hardware Translation Engine

Dashboard platform quotas are automatically translated into physical hardware inventory items in [`backend/src/utils/seedFromDashboard.js`](file:///c:/Users/shrik/OneDrive/Desktop/digitoppers-project-tracker/backend/src/utils/seedFromDashboard.js):

| Dashboard Platform (`school.platforms[]`) | Tracker Hardware Item Key | Equipment Name & Specification Notes |
| :--- | :--- | :--- |
| `platform: 'ifp'` | `IFP_PANEL` | **Interactive Flat Panel (75" 4K UHD)** Touch screen with Android 13 + OPS Windows |
| `platform: 'tablet'` | `STUDENT_TABLETS` | **Student Learning Tablets (10")** Ruggedized Android 13 with Kiosk Mode |
| `platform: 'windows'` | `SERVER_MINI_PC` | **Mini PC / Central Lab Server** Intel Core i5, 16GB RAM, 512GB SSD Windows 11 Pro |
| `platform: 'linux'` | `NETWORKING_ROUTER` | **Gigabit Switch & Local Server Hub** Ubuntu Core Managed Distribution Network |

---

## 🏫 Multi-School & Branch Architecture

Projects often span multiple school branches under a single education trust or state department (e.g. DoE Delhi, Pune ZP).

### Frontend Component: [`MultiSchoolSection.tsx`](file:///c:/Users/shrik/OneDrive/Desktop/digitoppers-project-tracker/frontend/src/components/forms/fields/MultiSchoolSection.tsx)
- **Dynamic Tab Switcher**: Seamlessly switch between schools (e.g. `Tab 1: Sarvodaya Kanya Vidyalaya`, `Tab 2: RPVV Surajmal Vihar`) without full-page reloads.
- **Aggregated Statistics Banner**:
  - Live count of active school sites.
  - Automatic calculation of cumulative student capacity across all branches.
- **Independent Branch Records**:
  - Each school branch retains isolated campus address, deployment lab room numbers, principal details, contact phone/email, and infrastructure flags (`labAvailable`, `internetAvailable`).
- **Dynamic Branch Creation**: One-click `+ Add School / Branch` to dynamically scale deployment sites.

---

## 📦 Hardware Stock, Procurement & Logistics Engine

The Tracker includes an inventory workflow in **Stage 04 (Execution)**:

1. **Stock Verification ([`HardwareStockCheck.tsx`](file:///c:/Users/shrik/OneDrive/Desktop/digitoppers-project-tracker/frontend/src/components/forms/fields/HardwareStockCheck.tsx))**:
   - Takes total required quantities from Stage 03.
   - User inputs warehouse `inStockQuantity`.
   - Engine computes deficit:  
     $$\text{purchaseQuantity} = \max(0, \text{requiredQuantity} - \text{inStockQuantity})$$
2. **Conditional Procurement ([`HardwarePurchaseSection.tsx`](file:///c:/Users/shrik/OneDrive/Desktop/digitoppers-project-tracker/frontend/src/components/forms/fields/HardwarePurchaseSection.tsx))**:
   - Automatically activates if any item has deficit $> 0$.
   - Allows per-item vendor assignment, PO/PI document uploads, unit pricing, and payment term logging.
3. **Logistics & Dispatch Tracking ([`HardwareConsignmentSection.tsx`](file:///c:/Users/shrik/OneDrive/Desktop/digitoppers-project-tracker/frontend/src/components/forms/fields/HardwareConsignmentSection.tsx))**:
   - Logs courier partners, tracking airway bill (AWB) numbers, estimated delivery dates, and receiving person confirmation.

---

## 🔐 Role-Based Access Control (RBAC) & Security

The system enforces two-tier authorization:

### 1. Global Roles (`Employee.globalRole`)
- **`ADMIN`**: Complete visibility and management across all projects, employees, timelines, and system configurations.
- **`EMPLOYEE`**: Scoped access restricted to projects where the employee is an assigned member.

### 2. Project Designations (`ProjectMember.designation`)
- **`PROJECT_MANAGER`**: Can update stage statuses, modify requirement forms, assign task owners, and manage project metadata.
- **`CONTRIBUTOR`**: Can update assigned task nodes (e.g. Tech Lead updating APK builds, Content Lead uploading dumps).
- **`VIEWER`**: Read-only access to project roadmaps, school information, and activity history.

---

## 🗄️ Database Schema & Data Models

### 1. Project Model ([`project.model.js`](file:///c:/Users/Admin/Desktop/Digitoppers/project-tracker/digi-ops-portal/backend/src/modules/projects/project.model.js))
```javascript
{
  projectName: { type: String, required: true },
  projectId: { type: String, required: true, uppercase: true, index: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String },
  numberOfSchools: { type: Number, default: 0 },
  numberOfLicenses: { type: Number, default: 0 },
  country: { type: mongoose.Schema.Types.ObjectId, ref: 'Country', required: false },
  isActive: { type: Boolean, default: true }
}
```

### 2. Requirement Model ([`requirements.model.js`](file:///c:/Users/shrik/OneDrive/Desktop/digitopper-project-tracker/backend/src/modules/requirements/requirements.model.js))
```javascript
{
  project: { type: ObjectId, ref: 'Project', required: true, unique: true },
  workflowVersion: { type: String, default: 'v1' },
  currentStageKey: { type: String, default: 'LEAD_AND_NEGOTIATION' },
  currentSubstageKey: { type: String, default: 'LEAD_CREATION' },
  leadAndNegotiation: { ... },
  poAndPi: { ... },
  orderRequirement: {
    schoolInformation: {
      schools: [{ schoolName, schoolCode, address, principalName, contactPerson, phone, email, totalStudents, labAvailable, internetAvailable, remarks }],
      schoolName: String,
      schoolCode: String,
      totalStudents: Number
    },
    solutionSelection: { solutions: Mixed, overallNotes: String },
    hardwareRequirement: { hardware: { items: Mixed }, overallHardwareNotes: String }
  },
  execution: {
    hardware: { reqAndStockCheck, purchaseIfNeeded, consignmentTracking, hardwareReady },
    tech: { projectConfigAndImplementation, techTesting },
    content: { contentConfiguration, contentReviewQA, sheetReadiness, dumpReadiness, contentReady }
  },
  status: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED'] }
}
```

---

## 📡 API Reference & Swagger Endpoints

API base URL: `http://localhost:5000/api/v1`  
Interactive Swagger Documentation: 👉 **[http://localhost:5000/api/docs](http://localhost:5000/api/docs)**

### Key Endpoint Groups:

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Authenticate user & return JWT tokens | No |
| `GET` | `/api/v1/auth/me` | Fetch currently authenticated user profile | Yes (Bearer) |
| `GET` | `/api/v1/projects` | Fetch all authorized projects with status filters | Yes (Bearer) |
| `POST` | `/api/v1/projects` | Create a project & initialize 8-stage timeline | Yes (Admin) |
| `GET` | `/api/v1/projects/:id` | Fetch detailed project metadata | Yes (Bearer) |
| `GET` | `/api/v1/projects/:id/timeline`| Fetch full timeline tree with nodes & form data | Yes (Bearer) |
| `PATCH` | `/api/v1/projects/:id/timeline/nodes/:nodeId` | Update task node status, assignee or form data | Yes (PM/Member)|
| `GET` | `/api/v1/requirements/:projectId` | Fetch master requirement & multi-school data | Yes (Bearer) |
| `POST` | `/api/v1/requirements/:projectId` | Upsert stage requirements & multi-school tabs | Yes (PM/Member)|
| `POST` | `/api/v1/upload` | Upload PDF documents, POs, PIs & reports | Yes (Bearer) |

---

## ⚙️ Installation, Environment Setup & Seeding

### 1. Prerequisites
- **Node.js**: v18.17+ or v20+
- **MongoDB**: MongoDB Atlas Cluster connection string (or local MongoDB 6.0+)
- **Ports**: Backend uses `5000`, Frontend uses `3000`

---

### 2. Backend Configuration & Startup

```bash
# 1. Navigate to backend
cd backend

# 2. Install dependencies
npm install

# 3. Create or verify .env file
# (Create backend/.env with the variables shown below)
```

**`backend/.env` Content:**
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.8lguhwy.mongodb.net/digitopper_tracker?retryWrites=true&w=majority
JWT_SECRET=super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=super_secret_refresh_key_change_in_production
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=*
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=300
STORAGE_DRIVER=local
LOCAL_STORAGE_DIR=uploads
EMAIL_DRIVER=console
```

```bash
# 4. Seed database with Dashboard Projects & Multi-School data
npm run seed:dashboard

# 5. Start Backend Server
npm run dev
```

---

### 3. Frontend Configuration & Startup

```bash
# 1. Navigate to frontend (in a separate terminal)
cd frontend

# 2. Install dependencies
npm install

# 3. Create frontend/.env
# NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1

# 4. Start Next.js Development Server
npm run dev
```

*Open your browser and navigate to: **[http://localhost:3000](http://localhost:3000)***

---

## 🔑 Pre-configured Test Credentials

| Account Name | Role | Email | Password | Assigned Scope |
| :--- | :--- | :--- | :--- | :--- |
| **System Administrator** | `ADMIN` | `admin@digitopper.com` | `Admin@123` | Master access to all projects, user management & settings |
| **Rahul Sharma (PM)** | `EMPLOYEE` | `rahul.pm@digitopper.com` | `Password@123` | PM for Delhi Schools (`PRJ-DASH-001`) & Karnataka (`PRJ-DASH-003`) |
| **Sneha Kulkarni (PM)** | `EMPLOYEE` | `sneha.pm@digitopper.com` | `Password@123` | PM for Maharashtra ZP (`PRJ-DASH-002`) & DAV Trust (`PRJ-DASH-004`)|
| **Amit Verma** | `EMPLOYEE` | `amit.contrib@digitopper.com` | `Password@123` | Contributor for Hardware & Tech streams |
| **Divya Nair** | `EMPLOYEE` | `divya.contrib@digitopper.com` | `Password@123` | Contributor for Content & QA streams |
| **Priya Iyer** | `EMPLOYEE` | `priya.viewer@digitopper.com` | `Password@123` | Viewer with read-only access to projects & status |

---

## 📂 Project Directory Structure

```
digitopper-project-tracker/
├── backend/
│   ├── src/
│   │   ├── app.js                    # Express app initialization & middleware stack
│   │   ├── config/
│   │   │   ├── database.js           # Mongoose connection & connection event handlers
│   │   │   ├── env.js                # Dotenv validation & configuration export
│   │   │   └── timeline.js           # 8-Stage timeline definitions & JSON form schemas
│   │   ├── core/
│   │   │   ├── constants.js          # Roles, statuses, hardware keys & designations
│   │   │   ├── errors.js             # AppError class & global error handler middleware
│   │   │   └── middleware.js         # Security headers, CORS, JWT auth & rate limiters
│   │   ├── modules/
│   │   │   ├── auth/                 # Login controllers, JWT signing & routes
│   │   │   ├── employees/            # Employee model, bcrypt hooks & user routes
│   │   │   ├── projects/             # Project model, member model & timeline initialization
│   │   │   ├── requirements/         # Dynamic requirement schema & upsert services
│   │   │   ├── timeline/             # Timeline & TimelineNode models and controllers
│   │   │   ├── activity/             # Audit logs & project event history
│   │   │   └── upload/               # Multer file upload handling for documents
│   │   └── utils/
│   │       ├── seedFromDashboard.js  # Dedicated seeder for Dashboard models & schools
│   │       ├── seed.js               # Standard seed script
│   │       └── swagger.js            # Swagger documentation setup
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── app/                      # Next.js 14 App Router
│   │   │   ├── login/                # Authentication page
│   │   │   ├── dashboard/            # Project overview & metric cards
│   │   │   └── tracker/              # Interactive roadmap canvas & drawer view
│   │   ├── components/
│   │   │   ├── forms/
│   │   │   │   ├── DynamicFormRenderer.tsx
│   │   │   │   └── fields/
│   │   │   │       ├── MultiSchoolSection.tsx         # Multi-school tabs switcher
│   │   │   │       ├── HardwareRequirementsInput.tsx  # Platform-to-hardware quotas
│   │   │   │       ├── HardwareStockCheck.tsx         # Warehouse inventory checker
│   │   │   │       ├── HardwarePurchaseSection.tsx    # Procurement PO & PI logger
│   │   │   │       ├── HardwareConsignmentSection.tsx # Logistics & AWB tracking
│   │   │   │       ├── ContentConfigSection.tsx       # Curriculum & board mapper
│   │   │   │       ├── AppFileDownloadSection.tsx     # APK build download section
│   │   │   │       ├── IntegrationTestingSection.tsx  # QA test results logging
│   │   │   │       └── SolutionsConfigTable.tsx       # Modular solution selector
│   │   │   └── ui/                   # StatCards, NavigationBar, Badges, Modals
│   │   ├── features/
│   │   │   ├── tracker/              # Mindmap workspace, roadmap nodes & drawer
│   │   │   └── dashboard/            # Project grid, filters & stats view
│   │   └── lib/                      # Axios client instance, auth tokens & storage
│   └── package.json
│
├── dashboard/                        # Original deployed DigiTopper Dashboard codebase
└── README.md                         # Project documentation
```

---

## 📜 License
Internal proprietary software developed for **DigiTopper EdTech Operations**. All rights reserved.
