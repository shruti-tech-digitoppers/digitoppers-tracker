const config = require('../config/env');

class CoreApiService {
  constructor() {
    this.baseUrl = (config.coreBackendUrl || process.env.CORE_BACKEND_URL || 'http://localhost:3001')
      .trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '');
    this.secret = (config.internalServiceSecret || process.env.INTERNAL_SERVICE_SECRET || 'tracker_core_shared_secret_2026')
      .trim().replace(/^["']|["']$/g, '');
    this.serviceName = 'tracker-backend';
    this.defaultTimeout = 8000;
    this.projectsCache = { data: null, timestamp: 0 };
    this.projectByIdCache = new Map();
    this.cacheTtlMs = 60 * 1000; // 60 seconds TTL for Core Backend WAN responses
  }

  /**
   * Clear all in-memory caches (called on create/update/approval)
   */
  clearCache() {
    this.projectsCache = { data: null, timestamp: 0 };
    this.projectByIdCache.clear();
  }

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
        } catch (_) { }
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
   * Fetch all live projects from Core Backend with TTL caching
   * Tries /api/projects and /projects
   * @param {Object} query - optional query parameters (e.g. { isActive: true })
   * @returns {Promise<Array>} List of project objects
   */
  async getProjects(query = {}) {
    const isDefaultQuery = Object.keys(query).length === 0;
    const now = Date.now();

    // Fast-path: Return cached projects if within TTL
    if (isDefaultQuery && this.projectsCache.data && (now - this.projectsCache.timestamp < this.cacheTtlMs)) {
      return this.projectsCache.data;
    }

    const queryString = new URLSearchParams(query).toString();
    const queryPart = queryString ? `?${queryString}` : '';

    // 1. Try /api/projects
    try {
      const json = await this.request(`/api/projects${queryPart}`);
      const list = json.projects || json.data?.projects || (Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []));
      if (Array.isArray(list) && list.length > 0) {
        if (isDefaultQuery) {
          this.projectsCache = { data: list, timestamp: now };
          // Prime individual cache by id and project code
          list.forEach(p => {
            if (p._id) this.projectByIdCache.set(String(p._id).toLowerCase(), { data: p, timestamp: now });
            if (p.projectId) this.projectByIdCache.set(String(p.projectId).toLowerCase(), { data: p, timestamp: now });
          });
        }
        return list;
      }
    } catch (err) {
      // 2. Try /projects (without /api prefix)
      try {
        const jsonAlt = await this.request(`/projects${queryPart}`);
        const listAlt = jsonAlt.projects || jsonAlt.data?.projects || (Array.isArray(jsonAlt.data) ? jsonAlt.data : (Array.isArray(jsonAlt) ? jsonAlt : []));
        if (Array.isArray(listAlt) && listAlt.length > 0) {
          if (isDefaultQuery) {
            this.projectsCache = { data: listAlt, timestamp: now };
            listAlt.forEach(p => {
              if (p._id) this.projectByIdCache.set(String(p._id).toLowerCase(), { data: p, timestamp: now });
              if (p.projectId) this.projectByIdCache.set(String(p.projectId).toLowerCase(), { data: p, timestamp: now });
            });
          }
          return listAlt;
        }
      } catch (_) { }
      console.warn('[CoreApiService] getProjects error:', err.message);
    }

    // If fetch failed but we have stale cached data, gracefully return it instead of empty
    if (isDefaultQuery && this.projectsCache.data) {
      return this.projectsCache.data;
    }

    return [];
  }

  /**
   * Fetch a single live project from Core Backend by ID or human-readable code
   * Queries /api/projects/:id directly (with /projects/:id fallback)
   * @param {string} projectIdOrCode - 24-character hex ObjectId or string code (e.g. "REQ-2026-008")
   * @returns {Promise<Object|null>} Single project object or null
   */
  async getProjectById(projectIdOrCode) {
    if (!projectIdOrCode) return null;
    const cleanId = String(projectIdOrCode.toLowerCase()).trim();
    if (!cleanId || cleanId === 'undefined' || cleanId === 'null') return null;

    const now = Date.now();
    const cachedEntry = this.projectByIdCache.get(cleanId);
    if (cachedEntry && (now - cachedEntry.timestamp < this.cacheTtlMs)) {
      return cachedEntry.data;
    }

    // Check if it exists in the projects list cache
    if (this.projectsCache.data) {
      const foundInList = this.projectsCache.data.find(
        p => (p._id && String(p._id).toLowerCase() === cleanId) || (p.projectId && String(p.projectId).toLowerCase() === cleanId)
      );
      if (foundInList) {
        this.projectByIdCache.set(cleanId, { data: foundInList, timestamp: now });
        return foundInList;
      }
    }

    // 1. Primary direct endpoint: /api/projects/:id
    try {
      const json = await this.request(`/api/projects/${encodeURIComponent(cleanId)}`);
      let foundProject = null;
      if (json && json.project) foundProject = json.project;
      else if (json && json.data?.project) foundProject = json.data.project;
      else if (json && json.data && !Array.isArray(json.data)) foundProject = json.data;
      else if (json && !json.data && !Array.isArray(json) && (json.projectName || json.projectId)) foundProject = json;

      if (foundProject) {
        this.projectByIdCache.set(cleanId, { data: foundProject, timestamp: now });
        if (foundProject._id) this.projectByIdCache.set(String(foundProject._id).toLowerCase(), { data: foundProject, timestamp: now });
        if (foundProject.projectId) this.projectByIdCache.set(String(foundProject.projectId).toLowerCase(), { data: foundProject, timestamp: now });
        return foundProject;
      }
    } catch (singleErr) {
      // 2. Alternative route: /projects/:id (in case Core Backend route is mounted without /api prefix)
      try {
        const jsonAlt = await this.request(`/projects/${encodeURIComponent(cleanId)}`);
        let foundProjectAlt = null;
        if (jsonAlt && jsonAlt.project) foundProjectAlt = jsonAlt.project;
        else if (jsonAlt && jsonAlt.data?.project) foundProjectAlt = jsonAlt.data.project;
        else if (jsonAlt && jsonAlt.data && !Array.isArray(jsonAlt.data)) foundProjectAlt = jsonAlt.data;
        else if (jsonAlt && !jsonAlt.data && !Array.isArray(jsonAlt) && (jsonAlt.projectName || jsonAlt.projectId)) foundProjectAlt = jsonAlt;

        if (foundProjectAlt) {
          this.projectByIdCache.set(cleanId, { data: foundProjectAlt, timestamp: now });
          return foundProjectAlt;
        }
      } catch (_) { }

      if (singleErr.status !== 404) {
        console.warn(`[CoreApiService] getProjectById(${cleanId}) warning:`, singleErr.message);
      }
    }

    return null;
  }

}

module.exports = new CoreApiService();
