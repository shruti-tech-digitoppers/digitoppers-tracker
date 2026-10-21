const mongoose = require('mongoose');
const ProjectRequest = require('./project-request.model');
const ProjectMember = require('../project-members/project-member.model');
const Employee = require('../employees/employee.model');
const Notification = require('../notifications/notifications.model');
const Activity = require('../activity/activity.model');
const config = require('../../config/env');
const coreApi = require('../../services/core-api.service');
const { DESIGNATIONS, PROJECT_STATUSES, NODE_TYPES, NODE_STATUSES } = require('../../core/constants');
const { AppError } = require('../../core/errors');

class RequestService {
  /**
   * Helper: Preview next Request ID without incrementing counter
   */
  async peekNextRequestId() {
    const currentYear = new Date().getFullYear();
    const prefix = `REQ-${currentYear}-`;
    const counterKey = `REQ_${currentYear}`;
    const ProjectRequestCounter = ProjectRequest.ProjectRequestCounter;

    let counter = await ProjectRequestCounter.findById(counterKey);
    let nextNum = 1;
    if (counter) {
      nextNum = counter.seq + 1;
    } else {
      const latest = await ProjectRequest.findOne({
        requestId: { $regex: `^REQ-${currentYear}-\\d+$`, $options: 'i' }
      }).sort({ requestId: -1 }).select('requestId').lean();

      if (latest && latest.requestId) {
        const match = latest.requestId.match(new RegExp(`^REQ-${currentYear}-(\\d+)`, 'i'));
        if (match && match[1]) {
          nextNum = (parseInt(match[1], 10) || 0) + 1;
        }
      }
    }

    let candidateId = `${prefix}${String(nextNum).padStart(3, '0')}`;
    while (await ProjectRequest.exists({ requestId: candidateId })) {
      nextNum++;
      candidateId = `${prefix}${String(nextNum).padStart(3, '0')}`;
    }

    return candidateId;
  }

  /**
   * Helper: Atomically generate next guaranteed unique sequential Request ID (e.g. REQ-2026-001)
   * Uses MongoDB $inc for true concurrency safety and O(1) performance.
   */
  async generateNextRequestId(session = null) {
    const currentYear = new Date().getFullYear();
    const prefix = `REQ-${currentYear}-`;
    const counterKey = `REQ_${currentYear}`;
    const ProjectRequestCounter = ProjectRequest.ProjectRequestCounter;

    // 1. Seed counter if not yet present in database
    const existingCounter = await ProjectRequestCounter.findById(counterKey);
    if (!existingCounter) {
      const latest = await ProjectRequest.findOne({
        requestId: { $regex: `^REQ-${currentYear}-\\d+$`, $options: 'i' }
      }).sort({ requestId: -1 }).select('requestId').lean();

      let currentMax = 0;
      if (latest && latest.requestId) {
        const match = latest.requestId.match(new RegExp(`^REQ-${currentYear}-(\\d+)`, 'i'));
        if (match && match[1]) {
          currentMax = parseInt(match[1], 10) || 0;
        }
      }

      await ProjectRequestCounter.findOneAndUpdate(
        { _id: counterKey },
        { $setOnInsert: { seq: currentMax } },
        { upsert: true, new: true }
      );
    }

    // 2. Atomic increment
    const sessionOpts = session ? { session } : {};
    let counter = await ProjectRequestCounter.findOneAndUpdate(
      { _id: counterKey },
      { $inc: { seq: 1 } },
      { new: true, upsert: true, ...sessionOpts }
    );

    let candidateId = `${prefix}${String(counter.seq).padStart(3, '0')}`;

    // 3. Fallback: guarantee no duplicate collision with legacy manual data
    while (await ProjectRequest.exists({ requestId: candidateId })) {
      counter = await ProjectRequestCounter.findOneAndUpdate(
        { _id: counterKey },
        { $inc: { seq: 1 } },
        { new: true, ...sessionOpts }
      );
      candidateId = `${prefix}${String(counter.seq).padStart(3, '0')}`;
    }

    return candidateId;
  }


  /**
   * 1. Create a New Project Request
   */
  async createRequest(data, creatorEmployeeId) {
    const creator = await Employee.findById(creatorEmployeeId);
    if (!creator) {
      throw new AppError('Creator employee not found.', 404, 'CREATOR_NOT_FOUND');
    }

    const projectTitle = (data.title || data.projectName || '').trim();
    if (!projectTitle) {
      throw new AppError('Project Name (title) is required.', 400, 'MISSING_PROJECT_NAME');
    }

    if (!data.requestedTo) {
      throw new AppError('Approver ("Requested To") is required.', 400, 'MISSING_REQUESTED_TO');
    }

    if (!data.projectManager) {
      throw new AppError('Assigned Project Manager is required.', 400, 'MISSING_PROJECT_MANAGER');
    }

    // Auto-generate or resolve unique requestId atomically
    let reqId = (data.requestId || '').trim().toUpperCase();
    const currentYear = new Date().getFullYear();
    const isYearReqId = reqId.startsWith(`REQ-${currentYear}-`);

    if (!reqId || isYearReqId) {
      const exists = reqId ? await ProjectRequest.findOne({ requestId: reqId }) : null;
      if (!reqId || exists) {
        reqId = await this.generateNextRequestId();
      }
    } else {
      const exists = await ProjectRequest.findOne({ requestId: reqId });
      if (exists) {
        throw new AppError(`Project Request with ID '${reqId}' already exists.`, 409, 'DUPLICATE_REQUEST_ID');
      }
    }

    // Validate Approver and PM existence
    const requestedToEmp = await Employee.findById(data.requestedTo);
    const pmEmp = await Employee.findById(data.projectManager);

    if (!requestedToEmp) {
      throw new AppError('Selected Requested To not found.', 404, 'APPROVER_NOT_FOUND');
    }
    if (!pmEmp) {
      throw new AppError('Selected Project Manager not found.', 404, 'PM_NOT_FOUND');
    }

    const request = await ProjectRequest.create({
      orgId: data.orgId || (creator ? creator.orgId : undefined),
      requestId: reqId,
      title: projectTitle,
      projectName: projectTitle,
      email: (data.email || '').trim(),
      country: (data.country || '').trim(),
      phone: (data.phone || '').trim(),
      address: (data.address || '').trim(),
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      remarks: (data.remarks || data.description || '').trim(),
      expectedProjectValue: Number(data.expectedProjectValue) || 0,
      requestedBy: creatorEmployeeId,
      requestedTo: data.requestedTo,
      projectManager: data.projectManager,
      status: 'PENDING'
    });

    // ── Notify the Approver ("Requested To") ──────────────────────
    await Notification.create({
      recipient: data.requestedTo,
      title: 'New Project Request Received',
      message: `${creator ? creator.name : 'An employee'} submitted a new project request: ${request.requestId} (${request.title}) and assigned you to review and confirm it. Proposed PM: ${pmEmp.name}.`,
      type: 'PROJECT_REQUEST_REVIEW',
      metadata: {
        requestId: request._id,
        requestCustomId: request.requestId,
        title: request.title,
        requesterName: creator ? creator.name : 'Employee',
        proposedPMName: pmEmp.name
      }
    });

    // ── In-App Notifications for Admins (Bell Icon only, strictly no Slack) ──
    const admins = await Employee.find({ globalRole: 'ADMIN', isActive: true });
    const adminDocs = [];
    for (const admin of admins) {
      if (
        admin._id.toString() !== data.requestedTo.toString() &&
        admin._id.toString() !== creatorEmployeeId.toString()
      ) {
        adminDocs.push({
          recipient: admin._id,
          title: 'New Project Request Received',
          message: `${creator ? creator.name : 'Employee'} submitted project request ${request.requestId} (${request.title}) assigned to ${requestedToEmp.name} for confirmation.`,
          type: 'GENERAL',
          metadata: { requestId: request._id },
          _skipSlack: true
        });
      }
    }
    if (adminDocs.length > 0) {
      await Notification.insertMany(adminDocs);
    }

    // ── Activity Log ───────────────────────────────────────────────
    await Activity.create({
      actor: creatorEmployeeId,
      action: 'PROJECT_CREATED',
      resourceType: 'ProjectRequest',
      resourceId: request._id,
      metadata: {
        requestId: request.requestId,
        title: request.title,
        requestedTo: data.requestedTo,
        projectManager: data.projectManager
      }
    });

    return await this.getRequestById(request._id);
  }

  /**
   * 2. Get All Project Requests
   */
  async getAllRequests(employee, query = {}) {
    const filter = {};
    if (query.status && query.status !== 'ALL') {
      filter.status = query.status;
    }

    const conditions = [];

    // Role-based scoping: Non-Admin employees ONLY see requests where they are:
    // 1. Requester (requestedBy)
    // 2. Approver / Reviewer (requestedTo)
    // 3. Assigned Project Manager (projectManager)
    if (employee && employee.globalRole !== 'ADMIN') {
      conditions.push({
        $or: [
          { requestedBy: employee._id },
          { requestedTo: employee._id },
          { projectManager: employee._id }
        ]
      });
    }

    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');
      conditions.push({
        $or: [
          { requestId: searchRegex },
          { title: searchRegex },
          { projectName: searchRegex },
          { remarks: searchRegex }
        ]
      });
    }

    if (conditions.length > 0) {
      filter.$and = conditions;
    }

    return await ProjectRequest.find(filter)
      .populate('requestedBy', 'name email employeeCode globalRole')
      .populate('requestedTo', 'name email employeeCode globalRole')
      .populate('projectManager', 'name email employeeCode globalRole')
      .populate('reviewedBy', 'name email employeeCode globalRole')
      .populate('projectId')
      .sort({ createdAt: -1 });
  }

  /**
   * 3. Get Project Request by ID
   */
  async getRequestById(id) {
    if (!id) {
      throw new AppError('Project request ID is required.', 400, 'INVALID_REQUEST_ID');
    }

    const idStr = typeof id === 'object' && id._id ? id._id.toString() : String(id);
    const isObjectId = mongoose.Types.ObjectId.isValid(idStr) && idStr.length === 24;

    const query = isObjectId
      ? { $or: [{ _id: idStr }, { requestId: idStr }] }
      : { requestId: idStr };

    const request = await ProjectRequest.findOne(query)
      .populate('requestedBy', 'name email employeeCode globalRole')
      .populate('requestedTo', 'name email employeeCode globalRole')
      .populate('projectManager', 'name email employeeCode globalRole')
      .populate('reviewedBy', 'name email employeeCode globalRole')
      .populate('projectId');

    if (!request) {
      throw new AppError(`Project request '${idStr}' not found.`, 404, 'REQUEST_NOT_FOUND');
    }
    return request;
  }

  /**
   * 4. Confirm / Approve Request & Link Live Core Backend Project
   * Adds the Core Backend Mongo project reference to ProjectRequest strictly via Core Backend API.
   * No direct DB interaction and no timeline initialization.
   */
  async approveRequest(requestId, approverEmployeeId, payload = {}) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const request = await ProjectRequest.findById(requestId).session(session);
      if (!request) {
        throw new AppError('Project request not found.', 404, 'REQUEST_NOT_FOUND');
      }

      if (request.status === 'APPROVED') {
        throw new AppError('This project request has already been approved and initialized.', 400, 'ALREADY_APPROVED');
      }

      const approver = await Employee.findById(approverEmployeeId).session(session);
      if (!approver) {
        throw new AppError('Approver employee not found.', 404, 'APPROVER_NOT_FOUND');
      }

      // Verify permission: Approver must be requestedTo OR an Admin
      const isRequestedTo = request.requestedTo.toString() === approverEmployeeId.toString();
      const isAdmin = approver.globalRole === 'ADMIN';
      if (!isRequestedTo && !isAdmin) {
        throw new AppError('You are not authorized to confirm this project request.', 403, 'FORBIDDEN_REVIEW');
      }

      // Determine Project ID from payload
      const inputProjectId = (payload.projectId || payload.dashboardProjectId || '').trim();
      if (!inputProjectId) {
        throw new AppError(
          'Project ID is required. Please select a Project from the dropdown to confirm this request.',
          400,
          'MISSING_PROJECT_ID'
        );
      }

      // ── Fetch live master project strictly via Centralized Core Backend API Client ──
      let coreProject = null;
      try {
        coreProject = await coreApi.getProjectById(inputProjectId);
      } catch (err) {
        console.warn('[RequestService] coreApi.getProjectById error during approval:', err.message);
      }

      if (!coreProject) {
        throw new AppError(
          `Project '${inputProjectId}' was not found in Core Backend.`,
          404,
          'PROJECT_NOT_FOUND'
        );
      }

      const finalCoreMongoId = (coreProject._id instanceof mongoose.Types.ObjectId)
        ? coreProject._id
        : new mongoose.Types.ObjectId(String(coreProject._id));
      const finalCoreProjectId = (coreProject.projectId || inputProjectId).trim();

      // ── Update Project Request: Reference Core Backend Project Mongo ID as projectId ──
      request.status = 'APPROVED';
      request.reviewedBy = approverEmployeeId;
      request.reviewedAt = new Date();
      request.reviewNotes = payload.reviewNotes || '';
      request.projectId = finalCoreMongoId;
      request.isManualDashboardCreated = true;
      await request.save({ session });

      // ── Assign Project Manager Membership (for access / permissions) ──
      if (request.projectManager) {
        await ProjectMember.findOneAndUpdate(
          { project: finalCoreMongoId, employee: request.projectManager },
          {
            project: finalCoreMongoId,
            employee: request.projectManager,
            designation: DESIGNATIONS.PROJECT_MANAGER,
            assignedBy: approverEmployeeId,
            isActive: true
          },
          { upsert: true, new: true, session }
        );
      }

      // ── Notifications ──
      if (request.projectManager) {
        await Notification.create([{
          recipient: request.projectManager,
          project: finalCoreMongoId,
          title: 'Assigned as Project Manager',
          message: `You have been assigned as the Project Manager for confirmed project ${finalCoreProjectId} (${coreProject.projectName || request.title}), approved by ${approver.name}.`,
          type: 'ASSIGNMENT',
          metadata: {
            projectId: finalCoreProjectId,
            projectDatabaseId: finalCoreMongoId,
            projectName: coreProject.projectName || request.title,
            approverName: approver.name,
            requestId: request.requestId
          }
        }], { session });
      }

      if (request.requestedBy.toString() !== approverEmployeeId.toString()) {
        await Notification.create([{
          recipient: request.requestedBy,
          project: finalCoreMongoId,
          title: 'Project Request Approved & Initialized',
          message: `Your project request ${request.requestId} (${request.title}) has been confirmed by ${approver.name} and linked to Core Backend Project ${finalCoreProjectId}.`,
          type: 'PROJECT_REQUEST_APPROVED',
          metadata: {
            projectId: finalCoreProjectId,
            projectDatabaseId: finalCoreMongoId,
            projectName: coreProject.projectName || request.title,
            approverName: approver.name,
            requestId: request.requestId
          }
        }], { session });
      }

      // ── Activity Log ──
      await Activity.create([{
        project: finalCoreMongoId,
        actor: approverEmployeeId,
        action: 'PROJECT_REQUEST_APPROVED',
        resourceType: 'Project',
        resourceId: finalCoreMongoId,
        metadata: {
          requestId: request.requestId,
          projectId: finalCoreProjectId,
          projectManager: request.projectManager,
          approver: approverEmployeeId,
          reviewNotes: payload.reviewNotes || ''
        }
      }], { session });

      await session.commitTransaction();
      session.endSession();

      // ── Dispatch Slack notification ──
      if (request.projectManager) {
        try {
          const { sendSlackNotification } = require('../notifications/slack.service');
          sendSlackNotification({
            title: 'Assigned as Project Manager',
            message: `You have been assigned as the Project Manager for newly confirmed project ${finalCoreProjectId} (${coreProject.projectName || request.title}), approved by ${approver.name}.`,
            type: 'PROJECT_ASSIGNED',
            assignedTo: request.projectManager,
            projectId: finalCoreProjectId,
            projectName: coreProject.projectName || request.title,
            metadata: {
              requestId: request.requestId,
              approverName: approver.name
            }
          }).catch((err) => {
            console.warn('[ProjectRequestService] Slack notify PM warning:', err.message);
          });
        } catch (_) { }
      }

      return {
        request,
        project: {
          _id: finalCoreMongoId,
          projectId: finalCoreProjectId,
          projectName: coreProject.projectName || request.title,
          source: 'CORE_BACKEND'
        }
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * 5. Reject Request
   */
  async rejectRequest(requestId, approverEmployeeId, payload = {}) {
    const request = await ProjectRequest.findById(requestId);
    if (!request) {
      throw new AppError('Project request not found.', 404, 'REQUEST_NOT_FOUND');
    }

    if (request.status !== 'PENDING') {
      throw new AppError(`Cannot reject a request that is currently ${request.status}.`, 400, 'INVALID_STATUS');
    }

    const approver = await Employee.findById(approverEmployeeId);
    const isRequestedTo = request.requestedTo.toString() === approverEmployeeId.toString();
    const isAdmin = approver.globalRole === 'ADMIN';
    if (!isRequestedTo && !isAdmin) {
      throw new AppError('You are not authorized to reject this project request.', 403, 'FORBIDDEN');
    }

    request.status = 'REJECTED';
    request.reviewedBy = approverEmployeeId;
    request.reviewedAt = new Date();
    request.reviewNotes = payload.reviewNotes || '';
    await request.save();

    // Notify requester
    await Notification.create({
      recipient: request.requestedBy,
      title: 'Project Request Rejected',
      message: `Your project request ${request.requestId} (${request.title}) was rejected by ${approver.name}. Notes: ${payload.reviewNotes || 'No notes provided.'}`,
      type: 'PROJECT_REQUEST_REJECTED',
      metadata: {
        requestId: request.requestId,
        reviewNotes: payload.reviewNotes || ''
      }
    });

    return request;
  }

  /**
   * 6. Get Available Dashboard Projects for Dropdown Selection
   * Tracker backend requests Core Backend to fetch live available projects.
   * Core Backend serves as the primary source of truth.
   */
  async getAvailableDashboardProjects() {
    let coreProjects = [];

    // 1. Tracker backend requests Core Backend
    try {
      const rawList = await coreApi.getProjects();
      if (Array.isArray(rawList) && rawList.length > 0) {
        coreProjects = rawList.filter(p => p.isActive !== false).map((p) => ({
          _id: String(p._id),
          projectId: (p.projectId || String(p._id)).trim().toUpperCase(),
          projectName: p.projectName || p.title || 'Untitled Core Project',
          title: p.projectName || p.title || 'Untitled Core Project',
          organization: p.organization || p.client || p.projectName || 'Core Organization',
          email: p.email || '',
          phone: p.phone || '',
          address: p.address || '',
          numberOfSchools: p.numberOfSchools || 0,
          numberOfLicenses: p.numberOfLicenses || 0,
          country: typeof p.country === 'object' && p.country ? p.country.name : (p.country || ''),
          isActive: p.isActive !== false,
          source: 'CORE_BACKEND'
        }));
      }
    } catch (coreErr) {
      console.warn('[RequestService] Core Backend available projects request error:', coreErr.message);
    }

    return coreProjects;
  }
}

module.exports = new RequestService();
