const config = require('../config/env');

/**
 * CoreApiService (Single Source of Truth Gateway)
 *
 * Centralized, production-grade client for communicating with Core Backend (LMS Backend).
 * NO local database fallbacks are permitted: Core Backend is the STRICT and ONLY source
 * of truth for:
 *   - Projects
 *   - Schools & Project Schools
 *   - Solutions
 *   - Hardware
 *   - Licenses
 *   - Curriculum Master Data (Grades, Streams, Boards, Languages, Subjects, Categories)
 *
 * Authentication:
 *   Secured via internal service HMAC/token headers:
 *   - x-signature: Shared internal service secret
 *   - x-service-name: 'tracker-backend'
 *   - x-timestamp: Replay prevention timestamp
 */
class CoreApiService {
  constructor() {
    this.baseUrl = (config.coreBackendUrl || process.env.CORE_BACKEND_URL || 'http://localhost:3001')
      .trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '');
    this.secret = (config.internalServiceSecret || process.env.INTERNAL_SERVICE_SECRET || 'tracker_core_shared_secret_2026')
      .trim().replace(/^["']|["']$/g, '');
    this.serviceName = 'tracker-backend';
    this.defaultTimeout = 25000; // 25s default to accommodate remote cloud spin-ups
  }

  /**
   * Helper to unwrap list responses from varying Core API payload shapes
   * @private
   */
  _unwrapList(json, preferredKey) {
    if (!json) return [];
    if (Array.isArray(json)) return json;
    if (preferredKey && Array.isArray(json[preferredKey])) return json[preferredKey];
    if (json.data) {
      if (preferredKey && Array.isArray(json.data[preferredKey])) return json.data[preferredKey];
      if (Array.isArray(json.data)) return json.data;
    }
    return [];
  }

  /**
   * Helper to unwrap single entity responses
   * @private
   */
  _unwrapEntity(json, preferredKey) {
    if (!json) return null;
    if (preferredKey && json[preferredKey] && typeof json[preferredKey] === 'object') {
      return json[preferredKey];
    }
    if (json.data) {
      if (preferredKey && json.data[preferredKey] && typeof json.data[preferredKey] === 'object') {
        return json.data[preferredKey];
      }
      if (!Array.isArray(json.data) && typeof json.data === 'object') {
        return json.data;
      }
    }
    if (!Array.isArray(json) && typeof json === 'object') return json;
    return null;
  }

  /**
   * Core HTTP Request dispatcher with internal service authentication and timeout
   */
  async request(endpoint, options = {}) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${cleanEndpoint}`;
    const timeoutMs = options.timeout || this.defaultTimeout;
    const timestamp = Date.now().toString();

    const headers = {
      'x-signature': this.secret,
      'x-service-signature': this.secret,
      'x-service-name': this.serviceName,
      'x-timestamp': timestamp,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: AbortSignal.timeout(timeoutMs)
      });

      if (!response.ok) {
        let errorMsg = `Core Backend HTTP ${response.status} (${response.statusText})`;
        try {
          const errJson = await response.json();
          if (errJson && errJson.message) errorMsg = errJson.message;
        } catch (_) { }
        const err = new Error(errorMsg);
        err.status = response.status;
        throw err;
      }

      // Handle 204 No Content
      if (response.status === 204) return null;

      return await response.json();
    } catch (err) {
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        const timeoutErr = new Error(`Core Backend request to '${cleanEndpoint}' timed out after ${timeoutMs}ms`);
        timeoutErr.status = 504;
        throw timeoutErr;
      }
      throw err;
    }
  }

  // =========================================================================
  // 1. PROJECTS MODULE (Core Backend: /api/projects)
  // =========================================================================

  /**
   * Fetch all live projects strictly from Core Backend API
   * GET /api/projects
   */
  async getProjects(query = {}) {
    const queryString = new URLSearchParams(query).toString();
    const queryPart = queryString ? `?${queryString}` : '';

    try {
      const json = await this.request(`/api/projects${queryPart}`);
      return this._unwrapList(json, 'projects');
    } catch (err) {
      console.warn('[CoreApiService] getProjects error:', err.message);
      return [];
    }
  }

  /**
   * Fetch single project by ID or Code strictly from Core Backend API
   * GET /api/projects/:id
   */
  async getProjectById(projectIdOrCode) {
    if (!projectIdOrCode) return null;
    const cleanId = String(projectIdOrCode).trim();
    if (!cleanId || cleanId === 'undefined' || cleanId === 'null') return null;

    try {
      const json = await this.request(`/api/projects/${encodeURIComponent(cleanId)}`);
      return this._unwrapEntity(json, 'project');
    } catch (err) {
      if (err.status !== 404) {
        console.warn(`[CoreApiService] getProjectById(${cleanId}) warning:`, err.message);
      }
      return null;
    }
  }

  /**
   * Create new project in Core Backend
   * POST /api/projects/create
   */
  async createProject(data) {
    const json = await this.request('/api/projects/create', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return this._unwrapEntity(json, 'project') || json;
  }

  /**
   * Update existing project in Core Backend
   * PUT /api/projects/:id
   */
  async updateProject(id, data) {
    const json = await this.request(`/api/projects/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return this._unwrapEntity(json, 'project') || json;
  }

  /**
   * Delete project in Core Backend
   * DELETE /api/projects/:id
   */
  async deleteProject(id) {
    return await this.request(`/api/projects/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  }

  // =========================================================================
  // 2. SCHOOLS MODULE (Core Backend: /api/schools & /api/projects/:id/schools)
  // =========================================================================

  /**
   * Fetch schools strictly from Core Backend API
   * GET /api/schools
   */
  async getSchools(query = {}) {
    const queryString = new URLSearchParams(query).toString();
    const queryPart = queryString ? `?${queryString}` : '';

    try {
      const json = await this.request(`/api/schools${queryPart}`);
      return this._unwrapList(json, 'schools');
    } catch (err) {
      console.warn('[CoreApiService] getSchools error:', err.message);
      return [];
    }
  }

  /**
   * Fetch schools for a specific project strictly from Core Backend API
   * GET /api/projects/:id/schools OR GET /api/schools?projectId=...
   */
  async getProjectSchools(projectIdOrCode) {
    if (!projectIdOrCode) return [];
    const cleanId = String(projectIdOrCode).trim();
    if (!cleanId || cleanId === 'undefined' || cleanId === 'null') return [];

    // 1. Try /api/projects/:id/schools
    try {
      const json = await this.request(`/api/projects/${encodeURIComponent(cleanId)}/schools`);
      const list = this._unwrapList(json, 'schools');
      if (Array.isArray(list) && list.length > 0) return list;
    } catch (_) { }

    // 2. Try /api/schools?projectId=:id
    try {
      const json = await this.request(`/api/schools?projectId=${encodeURIComponent(cleanId)}`);
      const list = this._unwrapList(json, 'schools');
      if (Array.isArray(list) && list.length > 0) return list;
    } catch (_) { }

    return [];
  }

  /**
   * Fetch single school strictly from Core Backend API
   * GET /api/schools/:schoolId
   */
  async getSchoolById(schoolIdOrCode) {
    if (!schoolIdOrCode) return null;
    const cleanId = String(schoolIdOrCode).trim();
    if (!cleanId || cleanId === 'undefined' || cleanId === 'null') return null;

    try {
      const json = await this.request(`/api/schools/${encodeURIComponent(cleanId)}`);
      return this._unwrapEntity(json, 'school');
    } catch (err) {
      if (err.status !== 404) {
        console.warn(`[CoreApiService] getSchoolById(${cleanId}) warning:`, err.message);
      }
      return null;
    }
  }

  /**
   * Create school in Core Backend
   * POST /api/schools/create
   */
  async createSchool(data) {
    const json = await this.request('/api/schools/create', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return this._unwrapEntity(json, 'school') || json;
  }

  /**
   * Update school in Core Backend
   * PUT /api/schools/:schoolId
   */
  async updateSchool(schoolId, data) {
    const json = await this.request(`/api/schools/${encodeURIComponent(schoolId)}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return this._unwrapEntity(json, 'school') || json;
  }

  /**
   * Delete school in Core Backend
   * DELETE /api/schools/:schoolId
   */
  async deleteSchool(schoolId) {
    return await this.request(`/api/schools/${encodeURIComponent(schoolId)}`, {
      method: 'DELETE'
    });
  }

  // =========================================================================
  // 3. SOLUTIONS MODULE (Core Backend: /api/solutions)
  // =========================================================================

  /**
   * Fetch all Solutions strictly from Core Backend API
   * GET /api/solutions
   */
  async getSolutions(query = {}) {
    const queryString = new URLSearchParams(query).toString();
    const queryPart = queryString ? `?${queryString}` : '';

    try {
      const json = await this.request(`/api/solutions${queryPart}`);
      return this._unwrapList(json, 'solutions');
    } catch (err) {
      console.warn('[CoreApiService] getSolutions error:', err.message);
      return [];
    }
  }

  /**
   * Fetch single Solution strictly from Core Backend API
   * GET /api/solutions/:id
   */
  async getSolutionById(idOrKey) {
    if (!idOrKey) return null;
    const cleanId = String(idOrKey).trim();

    try {
      const json = await this.request(`/api/solutions/${encodeURIComponent(cleanId)}`);
      return this._unwrapEntity(json, 'solution');
    } catch (_) {
      return null;
    }
  }

  /**
   * Create Solution in Core Backend
   * POST /api/solutions
   */
  async createSolution(data) {
    const json = await this.request('/api/solutions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return this._unwrapEntity(json, 'solution') || json;
  }

  /**
   * Create Solutions in Bulk in Core Backend
   * POST /api/solutions/bulk
   */
  async createSolutionsBulk(items) {
    return await this.request('/api/solutions/bulk', {
      method: 'POST',
      body: JSON.stringify({ solutions: items })
    });
  }

  /**
   * Update Solution in Core Backend
   * PUT /api/solutions/:id
   */
  async updateSolution(idOrKey, data) {
    const json = await this.request(`/api/solutions/${encodeURIComponent(idOrKey)}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return this._unwrapEntity(json, 'solution') || json;
  }

  /**
   * Delete Solution in Core Backend
   * DELETE /api/solutions/:id
   */
  async deleteSolution(idOrKey) {
    return await this.request(`/api/solutions/${encodeURIComponent(idOrKey)}`, {
      method: 'DELETE'
    });
  }

  // =========================================================================
  // 4. HARDWARE MODULE (Core Backend: /api/hardware & /api/hardwares)
  // =========================================================================

  /**
   * Fetch Hardware catalog strictly from Core Backend API
   * GET /api/hardware
   */
  async getHardware(query = {}) {
    const queryString = new URLSearchParams(query).toString();
    const queryPart = queryString ? `?${queryString}` : '';

    try {
      const json = await this.request(`/api/hardware${queryPart}`);
      const list = this._unwrapList(json, 'hardwares');
      return list.length > 0 ? list : this._unwrapList(json, 'hardware');
    } catch (err) {
      console.warn('[CoreApiService] getHardware error:', err.message);
      return [];
    }
  }

  async getHardwares(query = {}) {
    return this.getHardware(query);
  }

  /**
   * Fetch single Hardware item strictly from Core Backend API
   * GET /api/hardware/:id
   */
  async getHardwareById(idOrKey) {
    if (!idOrKey) return null;
    const cleanId = String(idOrKey).trim();

    try {
      const json = await this.request(`/api/hardware/${encodeURIComponent(cleanId)}`);
      return this._unwrapEntity(json, 'hardware');
    } catch (_) {
      return null;
    }
  }

  /**
   * Create Hardware in Core Backend
   * POST /api/hardware
   */
  async createHardware(data) {
    const json = await this.request('/api/hardware', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return this._unwrapEntity(json, 'hardware') || json;
  }

  /**
   * Create Hardware in Bulk in Core Backend
   * POST /api/hardware/bulk
   */
  async createHardwareBulk(items) {
    return await this.request('/api/hardware/bulk', {
      method: 'POST',
      body: JSON.stringify({ hardware: items })
    });
  }

  /**
   * Update Hardware in Core Backend
   * PUT /api/hardware/:id
   */
  async updateHardware(idOrKey, data) {
    const json = await this.request(`/api/hardware/${encodeURIComponent(idOrKey)}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return this._unwrapEntity(json, 'hardware') || json;
  }

  /**
   * Delete Hardware in Core Backend
   * DELETE /api/hardware/:id
   */
  async deleteHardware(idOrKey) {
    return await this.request(`/api/hardware/${encodeURIComponent(idOrKey)}`, {
      method: 'DELETE'
    });
  }

  // =========================================================================
  // 5. LICENSES MODULE (Core Backend: /api/license)
  // =========================================================================

  /**
   * Fetch licenses strictly from Core Backend API
   * Endpoints:
   *   - If schoolId provided: GET /api/license/all/:schoolId
   *   - If projectId provided: fetches project schools from Core Backend and queries each school
   *   - Otherwise: GET /api/license
   * NO fallback to local database!
   */
  async getLicenses(query = {}) {
    try {
      // 1. Query by specific schoolId on Core Backend: /api/license/all/:schoolId
      if (query.schoolId) {
        const cleanSchoolId = String(query.schoolId).trim();
        try {
          const json = await this.request(`/api/license/all/${encodeURIComponent(cleanSchoolId)}`);
          const list = this._unwrapList(json, 'licenses');
          if (Array.isArray(list)) return list;
        } catch (_) { }
      }

      // 2. Query by projectId: Fetch project schools strictly from Core Backend, then fetch their licenses
      if (query.projectId) {
        const schools = await this.getProjectSchools(query.projectId);
        if (Array.isArray(schools) && schools.length > 0) {
          const allLicenses = [];
          for (const sch of schools) {
            const schKey = sch.schoolId || sch._id || sch.id;
            if (!schKey) continue;
            try {
              const res = await this.request(`/api/license/all/${encodeURIComponent(schKey)}`);
              const list = this._unwrapList(res, 'licenses');
              if (Array.isArray(list) && list.length > 0) {
                list.forEach((lic) => {
                  allLicenses.push({
                    ...lic,
                    schoolId: sch._id || sch.schoolId || sch.id,
                    schoolName: sch.name || sch.schoolName || '',
                    projectId: query.projectId
                  });
                });
              }
            } catch (_) { }
          }
          return allLicenses;
        }
        return [];
      }

      // 3. General query on Core Backend /api/license
      const queryString = new URLSearchParams(query).toString();
      const queryPart = queryString ? `?${queryString}` : '';
      const json = await this.request(`/api/license${queryPart}`);
      return this._unwrapList(json, 'licenses');
    } catch (err) {
      console.warn('[CoreApiService] getLicenses error:', err.message);
      return [];
    }
  }

  /**
   * Fetch single license strictly from Core Backend API
   */
  async getLicenseById(keyOrId) {
    if (!keyOrId) return null;
    const cleanId = String(keyOrId).trim();
    if (!cleanId || cleanId === 'undefined' || cleanId === 'null') return null;

    try {
      const json = await this.request(`/api/license/${encodeURIComponent(cleanId)}`);
      return this._unwrapEntity(json, 'license');
    } catch (_) {
      return null;
    }
  }

  /**
   * Activate license on Core Backend
   * POST /api/license/activate
   */
  async activateLicense({ licenseKey, deviceId }) {
    return await this.request('/api/license/activate', {
      method: 'POST',
      body: JSON.stringify({ licenseKey, deviceId })
    });
  }

  /**
   * Validate license on Core Backend
   * POST /api/license/validate
   */
  async validateLicense({ licenseKey, deviceId }) {
    return await this.request('/api/license/validate', {
      method: 'POST',
      body: JSON.stringify({ licenseKey, deviceId })
    });
  }

  /**
   * Migrate device ID for an existing license on Core Backend
   * POST /api/license/migrate-device-id
   */
  async migrateLicenseDeviceId({ licenseKey, oldDeviceId, newDeviceId }) {
    return await this.request('/api/license/migrate-device-id', {
      method: 'POST',
      body: JSON.stringify({ licenseKey, oldDeviceId, newDeviceId })
    });
  }

  /**
   * Refresh / Reset license on Core Backend
   * POST /api/license/:licenseId/refresh
   */
  async refreshLicense(licenseId) {
    return await this.request(`/api/license/${encodeURIComponent(licenseId)}/refresh`, {
      method: 'POST'
    });
  }

  // =========================================================================
  // 6. MASTER CURRICULUM & METADATA (Core Backend: /api/grades, etc.)
  // =========================================================================

  /**
   * Fetch active curriculum grades strictly from Core Backend
   * GET /api/grades
   */
  async getGrades(query = {}) {
    const queryString = new URLSearchParams(query).toString();
    const queryPart = queryString ? `?${queryString}` : '';

    try {
      const json = await this.request(`/api/grades${queryPart}`);
      return this._unwrapList(json, 'grades');
    } catch (err) {
      console.warn('[CoreApiService] getGrades error:', err.message);
      return [];
    }
  }

  /**
   * Fetch single grade by ID from Core Backend
   * GET /api/grades/:id
   */
  async getGradeById(idOrCode) {
    if (!idOrCode) return null;
    const cleanId = String(idOrCode).trim();

    try {
      const json = await this.request(`/api/grades/${encodeURIComponent(cleanId)}`);
      return this._unwrapEntity(json, 'grade');
    } catch (_) {
      return null;
    }
  }

  /**
   * Fetch grade streams strictly from Core Backend
   * GET /api/grade-streams
   */
  async getGradeStreams(query = {}) {
    const queryString = new URLSearchParams(query).toString();
    const queryPart = queryString ? `?${queryString}` : '';

    try {
      const json = await this.request(`/api/grade-streams${queryPart}`);
      return this._unwrapList(json, 'gradeStreams');
    } catch (err) {
      console.warn('[CoreApiService] getGradeStreams error:', err.message);
      return [];
    }
  }

  /**
   * Fetch single grade stream from Core Backend
   * GET /api/grade-streams/:id
   */
  async getGradeStreamById(idOrCode) {
    if (!idOrCode) return null;
    const cleanId = String(idOrCode).trim();

    try {
      const json = await this.request(`/api/grade-streams/${encodeURIComponent(cleanId)}`);
      return this._unwrapEntity(json, 'gradeStream');
    } catch (_) {
      return null;
    }
  }

  /**
   * Fetch L0 Categories strictly from Core Backend
   * GET /api/l0categories
   */
  async getL0Categories(query = {}) {
    const queryString = new URLSearchParams(query).toString();
    const queryPart = queryString ? `?${queryString}` : '';

    try {
      const json = await this.request(`/api/l0categories${queryPart}`);
      return this._unwrapList(json, 'l0categories');
    } catch (err) {
      console.warn('[CoreApiService] getL0Categories error:', err.message);
      return [];
    }
  }

  /**
   * Fetch single L0 Category from Core Backend
   * GET /api/l0categories/:id
   */
  async getL0CategoryById(idOrCode) {
    if (!idOrCode) return null;
    const cleanId = String(idOrCode).trim();

    try {
      const json = await this.request(`/api/l0categories/${encodeURIComponent(cleanId)}`);
      return this._unwrapEntity(json, 'category');
    } catch (_) {
      return null;
    }
  }

  /**
   * Fetch Boards strictly from Core Backend
   * GET /api/boards
   */
  async getBoards(query = {}) {
    const queryString = new URLSearchParams(query).toString();
    const queryPart = queryString ? `?${queryString}` : '';

    try {
      const json = await this.request(`/api/boards${queryPart}`);
      return this._unwrapList(json, 'boards');
    } catch (err) {
      console.warn('[CoreApiService] getBoards error:', err.message);
      return [];
    }
  }

  /**
   * Fetch Languages strictly from Core Backend
   * GET /api/languages
   */
  async getLanguages(query = {}) {
    const queryString = new URLSearchParams(query).toString();
    const queryPart = queryString ? `?${queryString}` : '';

    try {
      const json = await this.request(`/api/languages${queryPart}`);
      return this._unwrapList(json, 'languages');
    } catch (err) {
      console.warn('[CoreApiService] getLanguages error:', err.message);
      return [];
    }
  }

  /**
   * Fetch Subjects strictly from Core Backend
   * GET /api/subjects
   */
  async getSubjects(query = {}) {
    const queryString = new URLSearchParams(query).toString();
    const queryPart = queryString ? `?${queryString}` : '';

    try {
      const json = await this.request(`/api/subjects${queryPart}`);
      return this._unwrapList(json, 'subjects');
    } catch (err) {
      console.warn('[CoreApiService] getSubjects error:', err.message);
      return [];
    }
  }
}

module.exports = new CoreApiService();
