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
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/projects/:projectId/timeline', timelineRoutes);
app.use('/api/v1/projects/:projectId/activity', activityRoutes);
app.use('/api/v1/requirements', requirementRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/upload', uploadRouter);

// 404 Wildcard Route
app.all('*', (req, res, next) => {
  next(new AppError(`Can not find ${req.originalUrl} on this server!`, 404, 'NOT_FOUND'));
});

app.use(errorHandler);

module.exports = app;