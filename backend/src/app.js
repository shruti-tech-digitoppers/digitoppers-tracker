const express = require('express');
const path = require('path');
const { setupSecurityMiddleware } = require('./core/middleware');
const { errorHandler, AppError } = require('./core/errors');
const setupSwagger = require('./utils/swagger');

const authRoutes = require('./modules/auth/auth.routes');
const employeeRoutes = require('./modules/employees/employee.routes');
const projectRoutes = require('./modules/projects/project.routes');
const timelineRoutes = require('./modules/timeline/timeline.routes');
const activityRoutes = require('./modules/activity/activity.routes');
const requirementRouter = require('./modules/requirements/requirements.routes');
const notificationRouter = require('./modules/notifications/notifications.routes');
const uploadRouter = require('./modules/upload/upload.routes');
const projectRequestRoutes = require('./modules/project-requests/project-request.routes');
const projectMemberRoutes = require('./modules/project-members/project-member.routes');
const projectSchoolRoutes = require('./modules/project-schools/project-schools.routes');
const {
  contentSectionRoutes,
  gradeRoutes,
  l0categoryRoutes,
} = require('./modules/content');
const solutionRouter = require('./modules/solutions/solution.routes');
const hardwareRouter = require('./modules/hardware/hardware.routes');
const hardwareSpecRoutes = require('./modules/hardware-specs/hardware-spec.routes');
const departmentRoutes = require('./modules/departments/department.routes');
const schoolRoutes = require('./modules/schools/school.routes');
const { licenseRoutes } = require('./modules/tech');
const trainingRoutes = require('./modules/training/training.routes');

const app = express();

setupSecurityMiddleware(app);

// Serve static uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Swagger Docs setup
setupSwagger(app);

// Root / Health-Check Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'DigiTopper Tracker Backend API is running successfully!',
    version: '1.0.0',
    docs: '/api/docs'
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/schools', schoolRoutes);
app.use('/api/v1/projects/:projectId/schools', schoolRoutes);
app.use('/api/v1/projects/:projectId/timeline', timelineRoutes);
app.use('/api/v1/projects/:projectId/activity', activityRoutes);
app.use('/api/v1/projects/:projectId/training', trainingRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/activities', activityRoutes);
app.use('/api/v1/requirements', requirementRouter);

// ── Operational Modules (Members, Requests, Schools) ──
app.use('/api/v1/project-members', projectMemberRoutes);
app.use('/api/v1/projects/:projectId/members', projectMemberRoutes);
app.use('/api/v1/project-requests', projectRequestRoutes);
app.use('/api/v1/requests', projectRequestRoutes); // Backward compatibility
app.use('/api/v1/project-schools', projectSchoolRoutes);
app.use('/api/v1/projects/:projectId/project-schools', projectSchoolRoutes);
app.use('/api/v1/training', trainingRoutes);

app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/upload', uploadRouter);
app.use('/api/v1/grades', gradeRoutes);
app.use('/api/v1/solutions', solutionRouter);
app.use('/api/v1/hardware', hardwareRouter);
app.use('/api/v1/hardware-specs', hardwareSpecRoutes);
app.use('/api/v1/specs', hardwareSpecRoutes);
app.use('/api/v1/l0-categories', l0categoryRoutes);
app.use('/api/v1/licenses', licenseRoutes);
app.use('/api/v1/tech/licenses', licenseRoutes);

// ── Content Sections (Canonical & Backward Compatibility) ──
app.use('/api/v1/content-sections', contentSectionRoutes);
app.use('/api/v1/blg', contentSectionRoutes);
app.use('/api/v1/section-wise-req', contentSectionRoutes);

// 404 Wildcard Route
app.all('*', (req, res, next) => {
  next(new AppError(`Can not find ${req.originalUrl} on this server!`, 404, 'NOT_FOUND'));
});

app.use(errorHandler);

module.exports = app;
