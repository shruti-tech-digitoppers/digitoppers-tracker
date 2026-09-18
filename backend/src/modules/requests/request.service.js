const mongoose = require('mongoose');
const ProjectRequest = require('./project-request.model');
const Project = require('../projects/project.model');
const ProjectMember = require('../projects/project-member.model');
const Timeline = require('../timeline/timeline.model');
const TimelineNode = require('../timeline/timeline-node.model');
const Employee = require('../employees/employee.model');
const Notification = require('../notifications/notifications.model');
const Activity = require('../activity/activity.model');
const timelineConfig = require('../../config/timeline');
const { DESIGNATIONS, PROJECT_STATUSES, NODE_TYPES, NODE_STATUSES } = require('../../core/constants');
const { AppError } = require('../../core/errors');

class RequestService {
  /**
   * Helper: Generate next guaranteed unique sequential Request ID (e.g. REQ-2026-001)
   */
  async generateNextRequestId() {
    const currentYear = new Date().getFullYear();
    const prefix = `REQ-${currentYear}-`;

    // Find all existing requests with this year's prefix
    const existingRequests = await ProjectRequest.find({
      requestId: { $regex: `^REQ-${currentYear}-`, $options: 'i' }
    }).select('requestId');

    let maxSeq = 0;
    for (const req of existingRequests) {
      const match = req.requestId.match(new RegExp(`^REQ-${currentYear}-(\\d+)`, 'i'));
      if (match && match[1]) {
        const seqNum = parseInt(match[1], 10);
        if (!isNaN(seqNum) && seqNum > maxSeq) {
          maxSeq = seqNum;
        }
      }
    }

    let nextNum = maxSeq + 1;
    let candidateId = `${prefix}${String(nextNum).padStart(3, '0')}`;

    // Loop check until guaranteed unique
    while (await ProjectRequest.exists({ requestId: candidateId })) {
      nextNum++;
      candidateId = `${prefix}${String(nextNum).padStart(3, '0')}`;
    }

    return candidateId;
  }

  /**
   * Helper: Initialize standard 8-Stage Timeline for a project
   */
  async _initializeProjectTimeline(projectId, session) {
    const timeline = await Timeline.create([{
      project: projectId,
      templateVersion: 'v1',
      status: NODE_STATUSES.IN_PROGRESS
    }], { session });

    const createdTimeline = timeline[0];

    for (const stageDef of timelineConfig.stages) {
      const stageNode = await TimelineNode.create([{
        timeline: createdTimeline._id,
        parentNode: null,
        type: NODE_TYPES.STAGE,
        key: stageDef.key,
        name: stageDef.name,
        order: stageDef.order,
        status: NODE_STATUSES.PENDING,
        dependencies: stageDef.dependencies || [],
        metadata: stageDef.metadata || {}
      }], { session });

      const createdStage = stageNode[0];

      if (stageDef.substages) {
        for (const subDef of stageDef.substages) {
          const subTaskNode = await TimelineNode.create([{
            timeline: createdTimeline._id,
            parentNode: createdStage._id,
            type: NODE_TYPES.TASK,
            key: subDef.key,
            name: subDef.name,
            order: subDef.order,
            status: NODE_STATUSES.PENDING,
            formSchema: subDef.formSchema || null,
            metadata: subDef.metadata || {}
          }], { session });

          const createdSub = subTaskNode[0];

          if (subDef.nested) {
            for (const nestedDef of subDef.nested) {
              await TimelineNode.create([{
                timeline: createdTimeline._id,
                parentNode: createdSub._id,
                type: NODE_TYPES.TASK,
                key: nestedDef.key,
                name: nestedDef.name,
                order: nestedDef.order,
                status: NODE_STATUSES.PENDING,
                formSchema: nestedDef.formSchema || null,
                metadata: {
                  ...(nestedDef.metadata || {}),
                  customFields: nestedDef.customFields || []
                }
              }], { session });
            }
          }
        }
      }
    }
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

    // Auto-generate or use unique requestId
    let reqId = (data.requestId || '').trim().toUpperCase();
    if (!reqId) {
      reqId = await this.generateNextRequestId();
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

    const requestOrg = (data.organization || data.client || projectTitle || 'Direct Organization').trim();

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
      organization: requestOrg,
      client: requestOrg,
      description: (data.description || data.address || '').trim(),
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

    // ── Notify Admins if requester or approver is not Admin ────────
    const admins = await Employee.find({ globalRole: 'ADMIN', isActive: true });
    for (const admin of admins) {
      if (
        admin._id.toString() !== data.requestedTo.toString() &&
        admin._id.toString() !== creatorEmployeeId.toString()
      ) {
        await Notification.create({
          recipient: admin._id,
          title: 'New Project Request Received',
          message: `${creator ? creator.name : 'Employee'} submitted project request ${request.requestId} (${request.title}) assigned to ${requestedToEmp.name} for confirmation.`,
          type: 'GENERAL',
          metadata: { requestId: request._id }
        });
      }
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
          { organization: searchRegex },
          { client: searchRegex }
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
      .populate('confirmedProjectId')
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
      .populate('confirmedProjectId');

    if (!request) {
      throw new AppError(`Project request '${idStr}' not found.`, 404, 'REQUEST_NOT_FOUND');
    }
    return request;
  }

  /**
   * 4. Confirm / Approve Request & Initialize Live Project
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

      const finalProjectId = inputProjectId.toUpperCase();

      // Check if project exists in Project Tracker
      const projectConditions = [{ projectId: finalProjectId }];
      if (mongoose.isValidObjectId(inputProjectId)) {
        projectConditions.push({ _id: inputProjectId });
      }
      let existingProject = await Project.findOne({ $or: projectConditions }).session(session);

      let newProject;

      if (!existingProject) {
        // ── Create the Live Project Record linked to Selected Project ID ───
        const createdProjects = await Project.create([{
          orgId: request.orgId || approver.orgId || undefined,
          projectId: finalProjectId,
          projectName: request.title,
          email: request.email || '',
          country: (request.country && mongoose.isValidObjectId(request.country)) ? request.country : undefined,
          phone: request.phone || '',
          address: request.address || '',
          isActive: request.isActive !== undefined ? request.isActive : true,
          organization: request.organization || request.client || request.title,
          description: request.description || '',
          expectedProjectValue: request.expectedProjectValue || 0,
          projectManager: request.projectManager,
          requestedBy: request.requestedBy,
          assignedReviewer: request.requestedTo,
          status: PROJECT_STATUSES.ACTIVE,
          reviewStatus: 'APPROVED',
          reviewNotes: payload.reviewNotes || request.reviewNotes || '',
          createdBy: approverEmployeeId
        }], { session });

        newProject = createdProjects[0];
      } else {
        // Existing Project: Update status to ACTIVE and ensure PM is assigned
        existingProject.status = PROJECT_STATUSES.ACTIVE;
        existingProject.reviewStatus = 'APPROVED';
        if (request.projectManager) {
          existingProject.projectManager = request.projectManager;
        }
        if (payload.reviewNotes) {
          existingProject.reviewNotes = payload.reviewNotes;
        }
        await existingProject.save({ session });
        newProject = existingProject;
      }

      // ── Initialize Full 8-Stage Timeline if not already present ───
      const existingTimeline = await Timeline.findOne({ project: newProject._id }).session(session);
      if (!existingTimeline) {
        await this._initializeProjectTimeline(newProject._id, session);
      }

      // ── Assign Project Manager Membership ─────────────────────────
      await ProjectMember.findOneAndUpdate(
        { project: newProject._id, employee: request.projectManager },
        {
          project: newProject._id,
          employee: request.projectManager,
          designation: DESIGNATIONS.PROJECT_MANAGER,
          assignedBy: approverEmployeeId,
          isActive: true
        },
        { upsert: true, new: true, session }
      );

      // ── Assign Requester Membership (Contributor / PM) ───────────
      if (request.requestedBy.toString() !== request.projectManager.toString()) {
        await ProjectMember.findOneAndUpdate(
          { project: newProject._id, employee: request.requestedBy },
          {
            project: newProject._id,
            employee: request.requestedBy,
            designation: DESIGNATIONS.CONTRIBUTOR,
            assignedBy: approverEmployeeId,
            isActive: true
          },
          { upsert: true, new: true, session }
        );
      }

      // ── Update Request Status to APPROVED & Link Project ID ───
      request.status = 'APPROVED';
      request.reviewedBy = approverEmployeeId;
      request.reviewedAt = new Date();
      request.reviewNotes = payload.reviewNotes || '';
      request.confirmedProjectId = newProject._id;
      request.projectId = finalProjectId;
      request.isManualDashboardCreated = true;
      await request.save({ session });

      // ── Notification to Assigned Project Manager ─────────────────
      await Notification.create([{
        recipient: request.projectManager,
        project: newProject._id,
        title: 'Assigned as Project Manager',
        message: `You have been assigned as the Project Manager for newly confirmed project ${newProject.projectId} (${newProject.projectName}), approved by ${approver.name}.`,
        type: 'ASSIGNMENT',
        metadata: {
          projectId: newProject.projectId,
          projectDatabaseId: newProject._id,
          projectName: newProject.projectName,
          approverName: approver.name,
          requestId: request.requestId
        }
      }], { session });

      // ── Notification to Requester ────────────────────────────────
      if (request.requestedBy.toString() !== approverEmployeeId.toString()) {
        await Notification.create([{
          recipient: request.requestedBy,
          project: newProject._id,
          title: 'Project Request Approved & Initialized',
          message: `Your project request ${request.requestId} (${request.title}) has been confirmed by ${approver.name} and initialized as ${newProject.projectId}.`,
          type: 'PROJECT_REQUEST_APPROVED',
          metadata: {
            projectId: newProject.projectId,
            projectDatabaseId: newProject._id,
            projectName: newProject.projectName,
            approverName: approver.name,
            requestId: request.requestId
          }
        }], { session });
      }

      // ── Activity Log ─────────────────────────────────────────────
      await Activity.create([{
        project: newProject._id,
        actor: approverEmployeeId,
        action: 'PROJECT_REQUEST_APPROVED',
        resourceType: 'Project',
        resourceId: newProject._id,
        metadata: {
          requestId: request.requestId,
          projectId: newProject.projectId,
          projectManager: request.projectManager,
          approver: approverEmployeeId,
          reviewNotes: payload.reviewNotes || ''
        }
      }], { session });

      // ── Sync to Dashboard auditlogs collection ────────────────────
      try {
        await mongoose.connection.collection('auditlogs').insertOne({
          orgId: newProject.orgId || new mongoose.Types.ObjectId(),
          actorId: approverEmployeeId,
          actorEmail: approver ? approver.email : 'admin@digitopper.com',
          action: 'projects:create',
          resource: 'Project',
          resourceId: String(newProject._id),
          delta: {
            projectName: newProject.projectName,
            projectId: newProject.projectId,
            organization: request.organization || newProject.organization || ''
          },
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } catch (_) { }

      await session.commitTransaction();
      session.endSession();

      return {
        request,
        project: newProject
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
      type: 'GENERAL',
      metadata: {
        requestId: request.requestId,
        reviewNotes: payload.reviewNotes || ''
      }
    });

    return request;
  }

  /**
   * 6. Get Available Dashboard Projects for Dropdown Selection
   */
  async getAvailableDashboardProjects() {
    const projects = await Project.find({})
      .select('_id projectId projectName email phone address country numberOfSchools numberOfLicenses isActive createdAt updatedAt')
      .sort({ createdAt: -1 });

    return projects.map((p) => ({
      _id: p._id,
      projectId: p.projectId || String(p._id),
      projectName: p.projectName || 'Untitled Project',
      email: p.email || '',
      phone: p.phone || '',
      address: p.address || '',
      numberOfSchools: p.numberOfSchools || 0,
      numberOfLicenses: p.numberOfLicenses || 0,
      isActive: p.isActive !== false
    }));
  }
}

module.exports = new RequestService();
