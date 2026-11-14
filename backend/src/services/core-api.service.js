const config = require('../config/env');

class CoreApiService {
  constructor() {
    this.baseUrl = (config.coreBackendUrl || process.env.CORE_BACKEND_URL || 'http://localhost:3001')
      .trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '');
    this.secret = (config.internalServiceSecret || process.env.INTERNAL_SERVICE_SECRET || 'tracker_core_shared_secret_2026')
      .trim().replace(/^["']|["']$/g, '');
    this.serviceName = 'tracker-backend';
    this.defaultTimeout = 15000;
  }

  /**
   * No-op cache clearing method for compatibility
   */
  clearCache() {}

  /**
   * Generic request helper with authentication headers, timeout and robust error parsing
   */
  async request(endpoint, options = {}) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${cleanEndpoint}`;
    const timeoutMs = options.timeout || this.defaultTimeout;

    const headers = {
      'x-signature': this.secret,
      'x-service-name': this.serviceName,
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
        let errorMsg = `Core API HTTP ${response.status} (${response.statusText})`;
        try {
          const errJson = await response.json();
          if (errJson && errJson.message) errorMsg = errJson.message;
        } catch (_) {}
        const err = new Error(errorMsg);
        err.status = response.status;
        throw err;
      }

      return await response.json();
    } catch (err) {
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        const timeoutErr = new Error(`Core API request to ${cleanEndpoint} timed out after ${timeoutMs}ms`);
        timeoutErr.status = 504;
        throw timeoutErr;
      }
      throw err;
    }
  }

  // ──────────────────────────────────────────
  // Projects Endpoints
  // ──────────────────────────────────────────

  /**
   * Fetch all live projects from Core Backend API: /api/projects
   */
  async getProjects(query = {}) {
    const queryString = new URLSearchParams(query).toString();
    const queryPart = queryString ? `?${queryString}` : '';

    try {
      const json = await this.request(`/api/projects${queryPart}`);
      const list = json.projects || json.data?.projects || (Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []));
      return Array.isArray(list) ? list : [];
    } catch (err) {
      console.warn('[CoreApiService] getProjects (/api/projects) error:', err.message);
      return [];
    }
  }

  /**
   * Fetch a single live project from Core Backend API: /api/projects/:id
   */
  async getProjectById(projectIdOrCode) {
    if (!projectIdOrCode) return null;
    const cleanId = String(projectIdOrCode).trim();
    if (!cleanId || cleanId === 'undefined' || cleanId === 'null') return null;

    try {
      const json = await this.request(`/api/projects/${encodeURIComponent(cleanId)}`);
      let foundProject = null;
      if (json && json.project) foundProject = json.project;
      else if (json && json.data?.project) foundProject = json.data.project;
      else if (json && json.data && !Array.isArray(json.data)) foundProject = json.data;
      else if (json && !json.data && !Array.isArray(json) && (json.projectName || json.projectId)) foundProject = json;

      return foundProject;
    } catch (singleErr) {
      if (singleErr.status !== 404) {
        console.warn(`[CoreApiService] getProjectById(${cleanId}) warning:`, singleErr.message);
      }
      return null;
    }
  }

  // ──────────────────────────────────────────
  // Schools Endpoints
  // ──────────────────────────────────────────

  /**
   * Fetch schools from Core Backend
   */
  async getSchools(query = {}) {
    const queryString = new URLSearchParams(query).toString();
    const queryPart = queryString ? `?${queryString}` : '';

    try {
      const json = await this.request(`/api/schools${queryPart}`);
      const list = json.schools || json.data?.schools || (Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []));
      if (Array.isArray(list)) return list;
    } catch (err) {
      try {
        const jsonAlt = await this.request(`/schools${queryPart}`);
        const listAlt = jsonAlt.schools || jsonAlt.data?.schools || (Array.isArray(jsonAlt.data) ? jsonAlt.data : (Array.isArray(jsonAlt) ? jsonAlt : []));
        if (Array.isArray(listAlt)) return listAlt;
      } catch (_) {}
      console.warn('[CoreApiService] getSchools error:', err.message);
    }
    return [];
  }

  /**
   * Fetch schools for a specific project strictly from Core Backend API
   * (/api/projects/:id/schools or /api/schools?projectId=...)
   * No database fallbacks — strictly routes through Core Backend API.
   */
  async getProjectSchools(projectIdOrCode) {
    if (!projectIdOrCode) return [];
    const cleanId = String(projectIdOrCode).trim();
    if (!cleanId || cleanId === 'undefined' || cleanId === 'null') return [];

    // 1. Core Backend HTTP API: /api/projects/:id/schools
    try {
      const json = await this.request(`/api/projects/${encodeURIComponent(cleanId)}/schools`);
      const list = json.schools || json.data?.schools || (Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []));
      if (Array.isArray(list) && list.length > 0) return list;
    } catch (err) {
      console.warn(`[CoreApiService] getProjectSchools(${cleanId}) API check:`, err.message);
    }

    // 2. Core Backend HTTP API: /api/schools?projectId=...
    try {
      const list = await this.getSchools({ projectId: cleanId });
      if (Array.isArray(list) && list.length > 0) return list;
    } catch (err) {
      console.warn(`[CoreApiService] getSchools({ projectId: ${cleanId} }) API check:`, err.message);
    }

    return [];
  }

  /**
   * Fetch single school from Core Backend by ID or schoolId
   */
  async getSchoolById(schoolIdOrCode) {
    if (!schoolIdOrCode) return null;
    const cleanId = String(schoolIdOrCode).trim();
    if (!cleanId || cleanId === 'undefined' || cleanId === 'null') return null;

    try {
      const json = await this.request(`/api/schools/${encodeURIComponent(cleanId)}`);
      const school = json.school || json.data?.school || (json.data && !Array.isArray(json.data) ? json.data : json);
      if (school && (school._id || school.name)) return school;
    } catch (err) {
      try {
        const jsonAlt = await this.request(`/schools/${encodeURIComponent(cleanId)}`);
        const schoolAlt = jsonAlt.school || jsonAlt.data?.school || (jsonAlt.data && !Array.isArray(jsonAlt.data) ? jsonAlt.data : jsonAlt);
        if (schoolAlt && (schoolAlt._id || schoolAlt.name)) return schoolAlt;
      } catch (_) {}
      if (err.status !== 404) {
        console.warn(`[CoreApiService] getSchoolById(${cleanId}) warning:`, err.message);
      }
    }
    return null;
  }

  // ──────────────────────────────────────────
  // Licenses Endpoints (Direct from Core Backend)
  // ──────────────────────────────────────────

  /**
   * Fetch licenses strictly from Core Backend API
   * Endpoint: /api/license/all/:schoolId or /api/license
   */
  async getLicenses(query = {}) {
    try {
      // 1. If schoolId provided, query directly from Core Backend: /api/license/all/:schoolId
      if (query.schoolId) {
        const cleanSchoolId = String(query.schoolId).trim();
        try {
          const json = await this.request(`/api/license/all/${encodeURIComponent(cleanSchoolId)}`);
          const list = json.licenses || (Array.isArray(json) ? json : []);
          if (Array.isArray(list) && list.length > 0) return list;
        } catch (_) {}

        // Fallback: if schoolId was MongoDB _id, resolve school object from Core Backend or local reference to get schoolId string
        try {
          const schoolObj = await this.getSchoolById(cleanSchoolId);
          if (schoolObj && schoolObj.schoolId && schoolObj.schoolId !== cleanSchoolId) {
            const json = await this.request(`/api/license/all/${encodeURIComponent(schoolObj.schoolId)}`);
            const list = json.licenses || (Array.isArray(json) ? json : []);
            if (Array.isArray(list) && list.length > 0) return list;
          }
        } catch (_) {}
      }

      // 2. If projectId provided, resolve all schools in project and fetch their licenses from Core Backend
      if (query.projectId) {
        let schools = await this.getProjectSchools(query.projectId);

        // If Core API schools endpoint returned empty, check local school references for this project to get schoolIds
        if (!Array.isArray(schools) || schools.length === 0) {
          try {
            const SchoolModel = require('../modules/schools/school.model');
            const localSchools = await SchoolModel.find({
              $or: [{ projectId: query.projectId }, { project: query.projectId }]
            }).lean();
            if (Array.isArray(localSchools) && localSchools.length > 0) {
              schools = localSchools;
            }
          } catch (_) {}
        }

        if (Array.isArray(schools) && schools.length > 0) {
          const allLicenses = [];
          for (const sch of schools) {
            const schKey = sch.schoolId || sch._id || sch.id;
            if (!schKey) continue;
            try {
              const res = await this.request(`/api/license/all/${encodeURIComponent(schKey)}`);
              const list = res.licenses || (Array.isArray(res) ? res : []);
              if (Array.isArray(list) && list.length > 0) {
                list.forEach((lic) => {
                  allLicenses.push({
                    ...lic,
                    schoolId: sch._id || sch.schoolId || sch.id,
                    schoolName: sch.name || sch.schoolName || '',
                    projectId: query.projectId,
                  });
                });
              }
            } catch (_) {}
          }
          if (allLicenses.length > 0) return allLicenses;
        }
      }

      // 3. Fallback: try general /api/license query on Core Backend
      const queryString = new URLSearchParams(query).toString();
      const queryPart = queryString ? `?${queryString}` : '';
      const json = await this.request(`/api/license${queryPart}`);
      const list = json.licenses || json.data?.licenses || (Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []));
      return Array.isArray(list) ? list : [];
    } catch (err) {
      console.warn('[CoreApiService] getLicenses error:', err.message);
      return [];
    }
  }

  /**
   * Activate license on Core Backend
   */
  async activateLicense({ licenseKey, deviceId }) {
    return await this.request('/api/license/activate', {
      method: 'POST',
      body: JSON.stringify({ licenseKey, deviceId }),
    });
  }

  /**
   * Migrate device ID for an existing license on Core Backend
   */
  async migrateLicenseDeviceId({ licenseKey, oldDeviceId, newDeviceId }) {
    return await this.request('/api/license/migrate-device-id', {
      method: 'POST',
      body: JSON.stringify({ licenseKey, oldDeviceId, newDeviceId }),
    });
  }

  /**
   * Fetch single license from Core Backend by ID or licenseKey
   */
  async getLicenseById(keyOrId) {
    if (!keyOrId) return null;
    const cleanId = String(keyOrId).trim();
    if (!cleanId || cleanId === 'undefined' || cleanId === 'null') return null;

    try {
      const json = await this.request(`/api/licenses/${encodeURIComponent(cleanId)}`);
      const lic = json.license || json.data?.license || (json.data && !Array.isArray(json.data) ? json.data : json);
      if (lic && (lic._id || lic.licenseKey)) return lic;
    } catch (_) {
      try {
        const jsonAlt = await this.request(`/api/license/${encodeURIComponent(cleanId)}`);
        const licAlt = jsonAlt.license || jsonAlt.data?.license || (jsonAlt.data && !Array.isArray(jsonAlt.data) ? jsonAlt.data : jsonAlt);
        if (licAlt && (licAlt._id || licAlt.licenseKey)) return licAlt;
      } catch (_) {}
    }
    return null;
  }

  // ──────────────────────────────────────────
  // Grades & Grade Streams Endpoints
  // ──────────────────────────────────────────

  /**
   * Fetch curriculum grades from Core Backend
   */
  async getGrades(query = {}) {
    const queryString = new URLSearchParams(query).toString();
    const queryPart = queryString ? `?${queryString}` : '';

    try {
      const json = await this.request(`/api/grades${queryPart}`);
      const list = json.data?.grades || json.grades || (Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []));
      return Array.isArray(list) ? list : [];
    } catch (err) {
      console.warn('[CoreApiService] getGrades error:', err.message);
      return [];
    }
  }

  /**
   * Fetch single grade by Mongo _id or string ID (e.g. 'c1', 'c10')
   */
  async getGradeById(idOrCode) {
    if (!idOrCode) return null;
    const cleanId = String(idOrCode).trim();

    try {
      const json = await this.request(`/api/grades/${encodeURIComponent(cleanId)}`);
      const grade = json.data?.grade || json.grade || (json.data && !Array.isArray(json.data) ? json.data : json);
      if (grade && (grade._id || grade.id)) return grade;
    } catch (_) {}
    return null;
  }

  /**
   * Fetch grade streams from Core Backend
   */
  async getGradeStreams(query = {}) {
    const queryString = new URLSearchParams(query).toString();
    const queryPart = queryString ? `?${queryString}` : '';

    try {
      const json = await this.request(`/api/grade-streams${queryPart}`);
      const list = json.data?.gradeStreams || json.gradeStreams || (Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []));
      return Array.isArray(list) ? list : [];
    } catch (err) {
      console.warn('[CoreApiService] getGradeStreams error:', err.message);
      return [];
    }
  }

  /**
   * Fetch single grade stream from Core Backend
   */
  async getGradeStreamById(idOrCode) {
    if (!idOrCode) return null;
    const cleanId = String(idOrCode).trim();

    try {
      const json = await this.request(`/api/grade-streams/${encodeURIComponent(cleanId)}`);
      const gs = json.data?.gradeStream || json.gradeStream || (json.data && !Array.isArray(json.data) ? json.data : json);
      if (gs && (gs._id || gs.id)) return gs;
    } catch (_) {}
    return null;
  }

  // ──────────────────────────────────────────
  // L0 Categories Endpoints
  // ──────────────────────────────────────────

  /**
   * Fetch L0 Categories from Core Backend
   */
  async getL0Categories(query = {}) {
    const queryString = new URLSearchParams(query).toString();
    const queryPart = queryString ? `?${queryString}` : '';

    try {
      const json = await this.request(`/api/l0categories${queryPart}`);
      const list = json.data?.l0categories || json.l0categories || (Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []));
      return Array.isArray(list) ? list : [];
    } catch (err) {
      console.warn('[CoreApiService] getL0Categories error:', err.message);
      return [];
    }
  }

  /**
   * Fetch single L0 Category from Core Backend
   */
  async getL0CategoryById(idOrCode) {
    if (!idOrCode) return null;
    const cleanId = String(idOrCode).trim();

    try {
      const json = await this.request(`/api/l0categories/${encodeURIComponent(cleanId)}`);
      const cat = json.data?.category || json.category || (json.data && !Array.isArray(json.data) ? json.data : json);
      if (cat && (cat._id || cat.id)) return cat;
    } catch (_) {}
    return null;
  }

  // ──────────────────────────────────────────
  // Solutions Endpoints (Single Source of Truth)
  // ──────────────────────────────────────────

  /**
   * Fetch all Solutions from Core Backend
   */
  async getSolutions(query = {}) {
    const queryString = new URLSearchParams(query).toString();
    const queryPart = queryString ? `?${queryString}` : '';

    try {
      const json = await this.request(`/api/solutions${queryPart}`);
      const list = json.solutions || json.data?.solutions || (Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []));
      return Array.isArray(list) ? list : [];
    } catch (err) {
      console.warn('[CoreApiService] getSolutions error:', err.message);
      return [];
    }
  }

  /**
   * Fetch single Solution from Core Backend by ID or key
   */
  async getSolutionById(idOrKey) {
    if (!idOrKey) return null;
    const cleanId = String(idOrKey).trim();

    try {
      const json = await this.request(`/api/solutions/${encodeURIComponent(cleanId)}`);
      const sol = json.solution || json.data?.solution || (json.data && !Array.isArray(json.data) ? json.data : json);
      if (sol && (sol._id || sol.key)) return sol;
    } catch (_) {}
    return null;
  }

  /**
   * Create Solution in Core Backend
   */
  async createSolution(data) {
    return await this.request('/api/solutions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update Solution in Core Backend
   */
  async updateSolution(idOrKey, data) {
    return await this.request(`/api/solutions/${encodeURIComponent(idOrKey)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete Solution in Core Backend
   */
  async deleteSolution(idOrKey) {
    return await this.request(`/api/solutions/${encodeURIComponent(idOrKey)}`, {
      method: 'DELETE',
    });
  }

  // ──────────────────────────────────────────
  // Hardware Endpoints (Single Source of Truth)
  // ──────────────────────────────────────────

  /**
   * Fetch Hardware catalog from Core Backend
   */
  async getHardware(query = {}) {
    const queryString = new URLSearchParams(query).toString();
    const queryPart = queryString ? `?${queryString}` : '';

    try {
      const json = await this.request(`/api/hardware${queryPart}`);
      const list = json.hardware || json.hardwares || json.data?.hardwares || (Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []));
      return Array.isArray(list) ? list : [];
    } catch (err) {
      console.warn('[CoreApiService] getHardware error:', err.message);
      return [];
    }
  }

  async getHardwares(query = {}) {
    return this.getHardware(query);
  }

  /**
   * Fetch single Hardware item from Core Backend by ID or key
   */
  async getHardwareById(idOrKey) {
    if (!idOrKey) return null;
    const cleanId = String(idOrKey).trim();

    try {
      const json = await this.request(`/api/hardware/${encodeURIComponent(cleanId)}`);
      const hw = json.hardware || json.data?.hardware || (json.data && !Array.isArray(json.data) ? json.data : json);
      if (hw && (hw._id || hw.key)) return hw;
    } catch (_) {}
    return null;
  }

  /**
   * Create Hardware in Core Backend
   */
  async createHardware(data) {
    return await this.request('/api/hardware', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update Hardware in Core Backend
   */
  async updateHardware(idOrKey, data) {
    return await this.request(`/api/hardware/${encodeURIComponent(idOrKey)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete Hardware in Core Backend
   */
  async deleteHardware(idOrKey) {
    return await this.request(`/api/hardware/${encodeURIComponent(idOrKey)}`, {
      method: 'DELETE',
    });
  }
}

module.exports = new CoreApiService();
