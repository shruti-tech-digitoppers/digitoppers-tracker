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
   * @param {Object} query - optional query parameters (e.g. { isActive: true })
   * @returns {Promise<Array>} List of project objects
   */
  async getProjects(query = {}) {
    try {
      const queryString = new URLSearchParams(query).toString();
      const endpoint = queryString ? `/api/projects?${queryString}` : '/api/projects';
      const json = await this.request(endpoint);
      return json.projects || json.data?.projects || json.data || [];
    } catch (err) {
      console.warn('[CoreApiService] getProjects error:', err.message);
      return [];
    }
  }

  /**
   * Fetch a single live project from Core Backend by ID or human-readable code
   * Checks /api/projects/:id first, then falls back to /api/projects list search
   * @param {string} projectIdOrCode - 24-character hex ObjectId or string code (e.g. "REQ-2026-008")
   * @returns {Promise<Object|null>} Single project object or null
   */
  async getProjectById(projectIdOrCode) {
    if (!projectIdOrCode) return null;
    const cleanId = String(projectIdOrCode).trim();
    if (!cleanId || cleanId === 'undefined' || cleanId === 'null') return null;

    // 1. Direct single endpoint: /api/projects/:id
    try {
      const json = await this.request(`/api/projects/${encodeURIComponent(cleanId)}`);
      if (json && json.project) return json.project;
      if (json && json.data?.project) return json.data.project;
      if (json && json.data && !Array.isArray(json.data)) return json.data;
    } catch (singleErr) {
      if (singleErr.status !== 404) {
        console.warn(`[CoreApiService] getProjectById(${cleanId}) warning:`, singleErr.message);
      }
    }

    // 2. Fallback: Search in full project list
    try {
      const list = await this.getProjects();
      const match = list.find(p =>
        (p.projectId && p.projectId.toLowerCase() === cleanId.toLowerCase()) ||
        String(p._id) === cleanId
      );
      if (match) return match;
    } catch (listErr) {
      console.warn('[CoreApiService] getProjectById list fallback error:', listErr.message);
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
