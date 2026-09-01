# Digitopper Project Tracker Backend

Production-oriented Node.js / Express / MongoDB backend for the Digitopper internal project tracker.

## Stack
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- bcryptjs password hashing
- Zod validation
- Helmet, CORS and rate limiting middleware
- Swagger UI

## Architecture
The backend intentionally uses a small relational model set:

`Employee -> ProjectMember -> Project -> Timeline -> TimelineNode`

`TimelineNode` uses `parentNode` for stage/task/nested-task hierarchy and `assignedTo` for contributor assignment. `Activity` provides project-scoped audit history.

## Fixed workflow
The timeline initializes automatically for a project and contains the 10 Digitopper stages:
1. Lead & Negotiation
2. Purchase Order (PO)
3. Proforma Invoice (PI)
4. Project Information & Requirement Gathering
5. School Onboarding
6. Execution
7. Tech + Content Testing
8. Installation
9. Training
10. Project Closure

Execution includes Hardware, Tech and Content workstreams. The Hardware branch supports in-stock and not-in-stock paths, and Tech + Content completion gates testing.

## Roles
Global roles: `ADMIN`, `EMPLOYEE`.

Project designations: `PROJECT_MANAGER`, `CONTRIBUTOR`, `VIEWER`.

Authorization is centralized and resource-scoped; a PM is not automatically authorized on another project, and contributors can modify only nodes assigned to them.

## Setup
```bash
npm install
cp .env.example .env
npm run seed
npm run dev
```

On Windows PowerShell, copy `.env.example` to `.env` manually if `cp` is unavailable.

Set real MongoDB/JWT secrets in `.env`. Never commit `.env`.

## Seed credentials
Development seed data:
- Admin: `admin@digitopper.com` / `Admin@123`
- PM: `rahul.pm@digitopper.com` / `Password@123`
- Contributor: `amit.contrib@digitopper.com` / `Password@123`
- Viewer: `priya.viewer@digitopper.com` / `Password@123`

Change these credentials before using any shared or production environment.

## API
Base path: `/api/v1`

Authentication:
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/refresh`
- `POST /auth/logout`

Employees:
- `GET /employees`
- `POST /employees`
- `GET /employees/:id`
- `PATCH /employees/:id`
- `PATCH /employees/:id/status`

Projects:
- `POST /projects`
- `GET /projects`
- `GET /projects/:id`
- `PATCH /projects/:id`
- `PATCH /projects/:id/archive`
- `GET /projects/:projectId/members`
- `POST /projects/:projectId/members`
- `PATCH /projects/:projectId/members/:employeeId`
- `DELETE /projects/:projectId/members/:employeeId`

Timeline:
- `GET /projects/:projectId/timeline`
- `GET /projects/:projectId/timeline/nodes/:nodeId`
- `GET /projects/:projectId/timeline/nodes/:nodeId/children`
- `PATCH /projects/:projectId/timeline/nodes/:nodeId/status`
- `PATCH /projects/:projectId/timeline/nodes/:nodeId/assignment`
- `GET /projects/:projectId/timeline/nodes/:nodeId/form`
- `PUT /projects/:projectId/timeline/nodes/:nodeId/form`

Activity:
- `GET /projects/:projectId/activity`

Swagger UI is exposed at `/docs`.

## Models
- Employee
- Project
- ProjectMember
- Timeline
- TimelineNode
- Activity

The implementation avoids separate Stage, SubStage, Assignment, Form, Dependency, Permission and Role collections.

## Security
Passwords are hashed, protected routes use JWT authentication, authorization is checked against project membership and node assignment, inputs are validated, and secrets are read from environment variables.

## Important note
This archive is assembled from the backend implementation supplied in the attached specification. Before production deployment, configure real secrets, a production MongoDB replica set for transaction support, a restricted CORS origin, HTTPS/reverse proxy, centralized production logging, monitoring, backups and a production test/CI pipeline.
