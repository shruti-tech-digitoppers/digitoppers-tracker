# DigiToppers Project Tracker — Database Architecture & Data Flow Guide
> **Document Purpose**: Yeh document hamare pooray system ke data structure, collections, keys aur data flow ko ek human-friendly aur readable format mein explain karta hai. Isko padh kar koi bhi naya developer 5 minute mein samajh sakta hai ki kahan kya save ho raha hai aur collections aapas mein kaise linked hain.

---

## 1. High-Level Architecture (The Big Picture)

Hamara architecture **Hybrid/Decoupled** model follow karta hai:

```
                ┌─────────────────────────────────────────┐
                │       DigiToppers Core Backend API       │
                │     (Single Source of Truth for Master  │
                │          Projects & Commercials)        │
                └────────────────────┬────────────────────┘
                                     │ (REST API / Caching)
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                   Operations & Tracker MongoDB                         │
 │                                                                        │
 │  [Master Catalogs]  ──►  [Project Requests]  ──►  [Execution Layers]   │
 │   • Employees             • Intake Form            • Project Members   │
 │   • Solutions & Specs     • Commercials            • Schools & Surveys │
 │   • Grades & Content      • Approvals              • Stage Requirements│
 │                                                    • Timeline Nodes    │
 │                                                    • Notifications     │
 └────────────────────────────────────────────────────────────────────────┘
```

> **Important Architecture Decision:**
> - **Projects & Departments collections local MongoDB mein exist nahi karti.** Projects Core Backend API se fetch hote hain aur Department module completely removed hai (roles/functional ownership lightweight string codes se drive hoti hai bina kisi heavy separate collection ke).
> - Local MongoDB sirf **operational tracking**, **school deployments**, **timeline milestones**, **member assignments**, aur **audit logs** ko manage karta hai via `projectId` (e.g. `PRJ-2026-001`).

---

## 2. Master Catalogs (Fixed Reference Data)

Yeh collections system ka foundational catalog banati hain. Inka data rarely change hota hai aur form dropdowns/selections mein use hota hai.

### A. `Employee` (`employees`)
Portal ke users aur field staff ka account directory.
* **File:** `src/modules/employees/employee.model.js`
* **Key Fields:**
  - `employeeCode`: Unique ID (e.g., `EMP001`)
  - `name`: Real name (e.g., *"Pawan Kumar"*)
  - `email`: Login email (lowercase, unique)
  - `passwordHash`: Bcrypt hashed password
  - `globalRole`: `ADMIN` ya `EMPLOYEE`
  - `designation`: Role (e.g., `Project Manager`, `Installation Engineer`, `Trainer`)
  - `canRequestNewProject`: Boolean flag jo decide karta hai user intake form bhar sakta hai ya nahi
  - `reportingManager`, `phone`, `slackMemberId`: Communication metadata

### B. Master Hardware, Solutions & Content
* **`Solution` (`solutions`)**: Hamare 7 core offerings (`STEM_LAB`, `ASTRONOMY`, `LANGUAGE`, `SCIENCE_LEARNING`, `EPATHSHALA`, `ROBOTICS`, `SMART_SHAALA`).
* **`Hardware` (`hardwares`)**: Physical equipment categories (e.g., `TELESCOPE`, `IFPD_PANEL`, `ROBOTICS_KIT`).
* **`HardwareSpec` (`hardware-specs`)**: Detailed equipment models linked to Hardware via `hardwareId` (e.g. Brand, Model, Screen Size, Processor, RAM).
* **`Grade` & `L0Category` & `Language`**: Content hierarchy — Nursery to Grade 12, subjects (Physics, Math, STEM, Robotics), aur delivery language (English, Hindi, Regional).

---

## 3. Operational Data Flow (From Intake to Delivery)

Jab koi naya project shuru hota hai, data is order mein create aur link hota hai:

```
[1. ProjectRequest]
   Submitted by Sales/Ops ──► Reviewed & Approved by Admin
                                     │
                                     ▼
[2. Project Execution Active] (Referenced by projectId)
   ├── ProjectMember      (Kaun PM hai, kaun contributor)
   ├── School             (Campuses, survey form, principal POC)
   ├── ProjectSchools     (1:1 aggregator summary per project)
   ├── Requirement        (8-stage master configuration & quantities)
   └── TimelineNode       (Roadmap milestones, tasks & approval sign-offs)
```



---

## 4. Operational Collections Deep-Dive

### A. `ProjectRequest` (`projectrequests`)
Client onboarding ka formal intake document. Jab client se initial discussion ya tender finalize hota hai, ye record banta hai.
* **File:** `src/modules/project-requests/project-request.model.js`
* **What gets saved:**
  - `requestId`: Auto-generated human ID (e.g., `REQ-2026-004`)
  - `projectName`, `organization`: Client and project title
  - `requestedBy`: ObjectId (`Employee` ref) — jisne request create ki
  - `budget`, `numberOfSchools`, `numberOfLicenses`: High-level metrics
  - `status`: `DRAFT` ➔ `SUBMITTED` ➔ `IN_REVIEW` ➔ `APPROVED` / `REJECTED`
  - `commercials`: PO number, tentative budget, expected timelines
  - `assignedReviewer`: ObjectId (`Employee` ref) — Admin jo verify karega

---

### B. `ProjectMember` (`projectmembers`)
Yeh table define karti hai ki kisi project par kis employee ki kya responsibility hai.
* **File:** `src/modules/project-members/project-member.model.js`
* **What gets saved:**
  - `projectId`: Project code string (e.g. `PRJ-2026-001`)
  - `employee`: ObjectId (`Employee` ref)
  - `designation`: Project specific role:
    - `PROJECT_MANAGER` (Full edit permissions)
    - `CONTRIBUTOR` (Task execution & uploads)
    - `VIEWER` (Read-only access)
  - `assignedBy`: ObjectId (`Employee` ref)
  - `isActive`: Boolean

---

### C. `School` (`schools`) & `ProjectSchools` (`projectschools`)
Real world mein ek project ke andar 1 se lekar 500 alag-alag school campuses ho sakte hain.
* **File:** `src/modules/schools/school.model.js`
* **School Campus Fields:**
  - `projectId`: Parent project code (uppercase string)
  - `name`: School ka naam (e.g., *"Kendriya Vidyalaya No. 1"*)
  - `schoolBranch`: Specific campus branch code/name
  - `address`, `city`, `district`, `state`, `pincode`: Geo location
  - `contactPerson`: Principal / POC ka name, phone, email, designation
  - `survey`: Initial site inspection data (room size, power outlets, network availability)
  - `installation`: `{ status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED', installedDate, engineer }`
  - `training`: `{ status: 'PENDING' | 'COMPLETED', trainerName, trainingDates, feedbackScore }`
* **ProjectSchools Aggregator (`projectschools`)**:
  - Har project ka ek single consolidated document hota hai jisme `totalSchools`, `completedInstallations`, `completedTrainings` dynamically cached hote hain dashboard speed ke liye.

---

### D. `Requirement` (`requirements`)
Yeh system ka sabse comprehensive collection hai. Har project ka exactly **1 document** hota hai jo project ke saare 8 implementation stages ke physical & technical requirements ko contain karta hai.
* **File:** `src/modules/requirements/requirements.model.js`
* **What gets saved inside:**
  - `projectId`: Unique Project code (Indexed)
  - `schools`: Array of School-level requirements:
    - `solutions`: Solution wise hardware list, item codes, quantity, verified serial numbers
    - `content`: Language, Grade, Category, Google Drive syllabus links, Sheet URLs
  - `digitalPackage`: Software license keys, ePathshala user accounts list, login credentials delivery status
  - `labSetup`: Room readiness check (tables, benches, earthing, electrical points, projector mount)
  - `commercialDocuments`: Client PO uploads, Proforma Invoices (PI), GST numbers, payment UTR references

---

### E. `TimelineNode` (`timelinenodes`)
Interactive Mindmap / Gantt Chart ki execution heartbeat.
* **File:** `src/modules/timeline/timeline-node.model.js`
* **Tree Structure:**
  - Stage Node ➔ Task Node ➔ Sub-task Node
* **What gets saved:**
  - `projectId`: Parent project identifier
  - `parentNode`: ObjectId (Self-referential `TimelineNode` ref, `null` for root stages)
  - `type`: `STAGE` ya `TASK`
  - `key`: Static unique identifier (e.g., `STAGE_01_KICKOFF`, `SITE_SURVEY`, `HARDWARE_DISPATCH`, `INSTALLATION_COMPLETED`)
  - `name`: Display title
  - `order`: Display sequencing (1, 2, 3...)
  - `status`: `LOCKED` ➔ `NOT_STARTED` ➔ `IN_PROGRESS` ➔ `COMPLETED`
  - `assignedTo`: ObjectId (`Employee` ref) — Assigned lead
  - `departmentCode`: Owning department (`OPS`, `TECH`, `CONTENT`, etc.)
  - `formData`: Sub-form payload (dates, uploaded inspection PDFs, remarks, checklist state)
  - `completedAt` & `completedBy`: Sign-off tracking audit trail

---

### F. `Activity` (`activities`)
Complete historical audit trail — "Kisne, kab, kis project mein kya change kiya".
* **File:** `src/modules/activity/activity.model.js`
* **What gets saved:**
  - `projectId`: Associated project
  - `performedBy`: ObjectId (`Employee` ref)
  - `action`: `CREATE`, `UPDATE`, `STAGE_COMPLETE`, `STATUS_CHANGE`, `ASSIGN_MEMBER`
  - `title`: Short log headline (e.g., *"Installation Completed at Campus A"*)
  - `description`: Detailed text
  - `entityType`: `PROJECT`, `REQUIREMENT`, `TIMELINE`, `SCHOOL`
  - `metadata`: Snapshot of previous vs new values

---

### G. `Notification` (`notifications`)
In-app notification system jo user ko real-time assignments aur review alerts deta hai.
* **File:** `src/modules/notifications/notifications.model.js`
* **What gets saved:**
  - `recipient`: ObjectId (`Employee` ref) — Jisko alert jana hai
  - `title`: Alert title
  - `message`: User readable text
  - `type`: `TASK_ASSIGNED`, `PROJECT_ASSIGNED`, `PROJECT_REQUEST_SUBMITTED`, `TIMELINE_UPDATED`
  - `isRead`: Boolean (`false` by default, turns `true` when clicked)
  - `metadata`: `{ projectId, nodeKey, requestId }` — Direct navigation ke liye

---

## 5. Summary Cheat Sheet (Quick Reference)

| Collection | Model File | Primary Identifiers | Kaam Kya Hai? |
| :--- | :--- | :--- | :--- |
| **`employees`** | `employee.model.js` | `_id`, `employeeCode`, `email` | Team members, logins, permissions, roles |
| **`projectrequests`** | `project-request.model.js` | `_id`, `requestId` (`REQ-xxxx`) | Naye projects ka intake & approval pipeline |
| **`projectmembers`** | `project-member.model.js` | `projectId` + `employee` | Project team assignments (PM / Contributor) |
| **`schools`** | `school.model.js` | `projectId`, `schoolBranch` | Ground deployments (Schools, survey, readiness) |
| **`projectschools`** | `project-schools.model.js` | `projectId` | Project ke saare schools ka performance aggregator |
| **`requirements`** | `requirements.model.js` | `projectId` (1 per project) | 8-stage technical & hardware configuration payload |
| **`timelinenodes`** | `timeline-node.model.js` | `projectId`, `key`, `parentNode` | Mindmap stages & execution milestone progress |
| **`activities`** | `activity.model.js` | `projectId`, `performedBy` | System-wide audit log for compliance |
| **`notifications`** | `notifications.model.js` | `recipient`, `isRead` | User specific notification inbox & alerts |

---

## 6. Golden Rules for Developers Working on this DB

1. **Never create a local `projects` model:** Project master record Core Backend API se aayega. Local DB mein hamesha `projectId` string match karke data link karein.
2. **Always query by case-insensitive `projectId`:** Different systems se `PRJ-001`, `prj-001` aa sakta hai. Code mein hamesha `.toUpperCase().trim()` use karein.
3. **Keep `requirements` authoritative:** Frontend par solution ya hardware update hone par master form `requirements` document mein save hota hai, jahan se baaki timeline nodes sync rehte hain.
4. **Lean indexing:** Heavy relations par `{ projectId: 1 }`, `{ employee: 1 }`, aur `{ isRead: 1 }` indexed hain taaki high traffic par MongoDB fast query return kare.

