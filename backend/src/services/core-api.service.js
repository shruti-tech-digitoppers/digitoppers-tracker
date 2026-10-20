const config = require('../config/env');

class CoreApiService {
  constructor() {
    this.baseUrl = (config.coreBackendUrl || process.env.CORE_BACKEND_URL || 'http://localhost:3001')
      .trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '');
    this.secret = (config.internalServiceSecret || process.env.INTERNAL_SERVICE_SECRET || 'tracker_core_shared_secret_2026')
      .trim().replace(/^["']|["']$/g, '');
    this.serviceName = 'tracker-backend';
    this.defaultTimeout = 8000;
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
   * Fetch all live projects from Core Backend
   * Tries /api/projects and /projects
   * @param {Object} query - optional query parameters (e.g. { isActive: true })
   * @returns {Promise<Array>} List of project objects
   */
  async getProjects(query = {}) {
    const queryString = new URLSearchParams(query).toString();
    const queryPart = queryString ? `?${queryString}` : '';

    // 1. Try /api/projects
    try {
      const json = await this.request(`/api/projects${queryPart}`);
      const list = json.projects || json.data?.projects || (Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []));
      if (Array.isArray(list) && list.length > 0) return list;
    } catch (err) {
      // 2. Try /projects (without /api prefix)
      try {
        const jsonAlt = await this.request(`/projects${queryPart}`);
        const listAlt = jsonAlt.projects || jsonAlt.data?.projects || (Array.isArray(jsonAlt.data) ? jsonAlt.data : (Array.isArray(jsonAlt) ? jsonAlt : []));
        if (Array.isArray(listAlt) && listAlt.length > 0) return listAlt;
      } catch (_) {}
      console.warn('[CoreApiService] getProjects error:', err.message);
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
    const cleanId = String(projectIdOrCode).trim();
    if (!cleanId || cleanId === 'undefined' || cleanId === 'null') return null;

    // 1. Primary direct endpoint: /api/projects/:id
    try {
      const json = await this.request(`/api/projects/${encodeURIComponent(cleanId)}`);
      if (json && json.project) return json.project;
      if (json && json.data?.project) return json.data.project;
      if (json && json.data && !Array.isArray(json.data)) return json.data;
      if (json && !json.data && !Array.isArray(json) && (json.projectName || json.projectId)) return json;
    } catch (singleErr) {
      // 2. Alternative route: /projects/:id (in case Core Backend route is mounted without /api prefix)
      try {
        const jsonAlt = await this.request(`/projects/${encodeURIComponent(cleanId)}`);
        if (jsonAlt && jsonAlt.project) return jsonAlt.project;
        if (jsonAlt && jsonAlt.data?.project) return jsonAlt.data.project;
        if (jsonAlt && jsonAlt.data && !Array.isArray(jsonAlt.data)) return jsonAlt.data;
        if (jsonAlt && !jsonAlt.data && !Array.isArray(jsonAlt) && (jsonAlt.projectName || jsonAlt.projectId)) return jsonAlt;
      } catch (_) {}

      if (singleErr.status !== 404) {
        console.warn(`[CoreApiService] getProjectById(${cleanId}) warning:`, singleErr.message);
      }
    }

    return null;
  }

  // ──────────────────────────────────────────
  // Schools Endpoints (Ready for immediate & future use)
  // ──────────────────────────────────────────

  /**
   * Fetch schools from Core Backend
   * @param {Object} query - optional query parameters (e.g. { projectId })
   * @returns {Promise<Array>} List of school objects
   */
  async getSchools(query = {}) {
    try {
      const queryString = new URLSearchParams(query).toString();
      const endpoint = queryString ? `/api/schools?${queryString}` : '/api/schools';
      const json = await this.request(endpoint);
      return json.schools || json.data?.schools || json.data || [];
    } catch (err) {
      console.warn('[CoreApiService] getSchools error:', err.message);
      return [];
    }
  }

  // ──────────────────────────────────────────
  // Languages Endpoints (Ready for immediate & future use)
  // ──────────────────────────────────────────

  /**
   * Fetch languages from Core Backend
   * @param {Object} query - optional query parameters
   * @returns {Promise<Array>} List of language objects
   */
  async getLanguages(query = {}) {
    try {
      const queryString = new URLSearchParams(query).toString();
      const endpoint = queryString ? `/api/languages?${queryString}` : '/api/languages';
      const json = await this.request(endpoint);
      return json.languages || json.data?.languages || json.data || [];
    } catch (err) {
      console.warn('[CoreApiService] getLanguages error:', err.message);
      return [];
    }
  }
}

module.exports = new CoreApiService();
