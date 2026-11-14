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
> - **Projects, Departments & Licenses collections local MongoDB mein exist nahi karti.** Projects aur Master Licenses dono strictly Core Backend API se live fetch hote hain (Single Source of Truth), aur Department module completely removed hai (roles/functional ownership lightweight string codes se drive hoti hai bina kisi heavy separate collection ke).
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
* **`HardwareSpec` (`hardware_specs`)**: Detailed equipment models linked to Hardware via `hardwareId` (e.g. Brand, Model, Screen Size, Processor, RAM).
* **`Grade` & `L0Category` (`l0_categories`) & `Language`**: Content hierarchy — Nursery to Grade 12, subjects (Physics, Math, STEM, Robotics), aur delivery language (English, Hindi, Regional).

### C. Master Static Timeline Nodes (`timeline_nodes`)
Static roadmap blueprint jo define karta hai ki poore system mein kaun kaun se stages, substages, aur tasks hain. Yeh dynamic runtime timeline se alag, fixed reference blueprint hai.
* **File:** `src/modules/timeline-nodes/timeline-node.model.js`
* **Collection:** `timeline_nodes`
* **Key Fields:**
  - `id`: Unique identifier (e.g., `PROJECT_REVIEWER`, `PO_AND_PI`, `PO_UPLOAD`, `TASK_REQ_AND_STOCK_CHECK`)
  - `name`: Human readable title (e.g., *"Project Review"*, *"PO & PI"*, *"PO Upload"*)
  - `title`: Hierarchy level enum (`stage`, `substage`, `tasks`)
  - `order`: Numeric sequence order (1, 2, 3...)
  - `parent_id`: Parent reference string:
    - Root stage: `null`
    - Substage: Parent stage ki `id`
    - Task: Agar stage ke paas substages hain toh substage ki `id`; agar stage ke paas direct koi substage nahi hai (e.g. Stage 1) toh task ki `parent_id` mein direct stage ki `id` aayegi.
  - `has_substages`: Boolean flag (`true` if stage has children substages)
  - `formSchema`: Static input fields blueprint

### D. Master Form Schemas (`form_schemas`)
Form schema module jo har stage, substage, aur task ke input fields ko define karta hai. Yeh static blueprint ke roop mein (`projectId: 'DEFAULT'`) ya project-specific overrides ke roop mein exist karta hai.
* **File:** `src/modules/form-schemas/form-schema.model.js`
* **Collection:** `form_schemas`
* **Key Fields:**
  - `id`: Custom identifier (e.g., `FS_DEFAULT_PO_UPLOAD` ya `FS_PRJ-2026-001_PO_UPLOAD`)
  - `nodeId`: Target node key (e.g., `PROJECT_REVIEWER`, `PO_UPLOAD`, `SCHOOL_ONBOARDING_INFORMATION`)
  - `projectId`: Core backend project identifier (`PRJ-2026-001`, ya `'DEFAULT'` for master catalog)
  - `project`: Core backend MongoDB project reference (`_id`)
  - `title` & `description`: Form headline aur guidance notes
  - `fields`: Array of field objects (`key`, `label`, `type`, `required`, `options`, `hint`, `defaultValue`)
* **Core Architecture Principle:**
  - **`form_schemas`** defines the keys (`poNumber`, `poDate`, `invoiceDocumentUrl`, etc.)
  - **`timeline_data`** stores the values (`formData: { poNumber: "PO-12345" }`)
  - Calling `GET /api/v1/projects/:projectId/form-schemas/:nodeId/data` merges them into `fieldsWithValues` automatically!

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

### E. `TimelineData` (`timeline_data`) & `TimelineNodes` (`timeline_nodes`)
Interactive Mindmap / Roadmap ki dynamic execution heartbeat. Yeh do collections ke zariye handle hota hai:
1. **`TimelineNode` (`timeline_nodes`)**: Master static blueprint (all 60 stages, substages & tasks).
2. **`TimelineData` (`timeline_data`)**: Per-project dynamic execution state tracker (status, assignment, completionDate, remarks, formData).
* **Files:** 
  - `src/modules/timeline-nodes/timeline-node.model.js` (`timeline_nodes`)
  - `src/modules/timeline-data/timeline-data.model.js` (`timeline_data`)
* **What gets saved in `timeline_data`:**
  - `_id`: Native MongoDB ObjectId
  - `nodeId`: String key referencing `timeline_nodes` (e.g. `PROJECT_REVIEWER`, `PO_UPLOAD`)
  - `node`: ObjectId ref `TimelineNodeStatic`
  - `projectId`: Target project identifier (e.g. `PRJ-2026-001`)
  - `project`: Core backend MongoDB project reference (`_id`)
  - `assignedTo`: ObjectId (`Employee` ref) — Jo user is particular stage/substage/task par assign hai
  - `status`: Execution state: `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`, `BLOCKED`, `ON_HOLD`
  - `completionDate`: Date jab task/stage complete hua (auto-set on `COMPLETED`)
  - `dueDate`: Due date for task/stage completion
  - `remarks`: Human notes, observations or delay/blocker explanations
  - `formData`: Dynamic form payload (dates, uploaded document URLs, remarks, checklists)

> **Note on Architecture Evolution:**
> Multi-word collection names ko clean aur consistent **snake_case format** (with underscores) mein standardize kar diya gaya hai: **`timeline_nodes`**, **`timeline_data`**, **`form_schemas`**, **`project_members`**, **`project_schools`**, **`project_requests`**, **`project_request_counters`**, **`school_hardware_licenses`**, **`hardware_specs`**, **`content_sections`**, aur **`l0_categories`**.

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
| **`project_requests`** | `project-request.model.js` | `_id`, `requestId` (`REQ-xxxx`) | Naye projects ka intake & approval pipeline |
| **`project_members`** | `project-member.model.js` | `projectId` + `employee` | Project team assignments (PM / Contributor) |
| **`schools`** | `school.model.js` | `projectId`, `schoolBranch` | Ground deployments (Schools, survey, readiness) |
| **`project_schools`** | `project-schools.model.js` | `projectId` | Project ke saare schools ka performance aggregator |
| **`requirements`** | `requirements.model.js` | `projectId` (1 per project) | 8-stage technical & hardware configuration payload |
| **`timeline_nodes`** | `timeline-node.model.js` | `id`, `title`, `parent_id` | Static blueprint of stages, substages, and tasks |
| **`form_schemas`** | `form-schema.model.js` | `id`, `nodeId`, `projectId` | Input fields definition (keys for form data) |
| **`timeline_data`** | `timeline-data.model.js` | `_id`, `projectId`, `nodeId` | Per-project live status, assignees, dates & form data |
| **`hardware_specs`** | `hardware-spec.model.js` | `hardwareId`, `code` | Hardware models and component specs |
| **`activities`** | `activity.model.js` | `projectId`, `performedBy` | System-wide audit log for compliance |
| **`notifications`** | `notifications.model.js` | `recipient`, `isRead` | User specific notification inbox & alerts |

---

## 6. Golden Rules for Developers Working on this DB

1. **Never create local `projects` or `licenses` models:** Projects aur Licenses master records strictly Core Backend API se aayenge. Local DB mein kisi bhi local license table ya model ki zaroorat nahi hai.
2. **Always query by case-insensitive `projectId`:** Different systems se `PRJ-001`, `prj-001` aa sakta hai. Code mein hamesha `.toUpperCase().trim()` use karein.
3. **Keep `requirements` authoritative:** Frontend par solution ya hardware update hone par master form `requirements` document mein save hota hai, jahan se baaki timeline nodes sync rehte hain.
4. **Lean indexing:** Heavy relations par `{ projectId: 1 }`, `{ employee: 1 }`, aur `{ isRead: 1 }` indexed hain taaki high traffic par MongoDB fast query return kare.

