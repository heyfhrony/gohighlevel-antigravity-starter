// -----------------------------------------------------------------------------
//  GHLClient — Universal sub-account client for GoHighLevel v2 API.
//
//  Designed for Google Antigravity & Node.js:
//    - Automatically loads .env and validates credentials.
//    - Injects locationId into sub-account endpoints.
//    - Automatic retry with exponential backoff on HTTP 429.
//    - Handles v3 endpoints automatically (e.g. contacts/search).
// -----------------------------------------------------------------------------

import 'dotenv/config';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const PLACEHOLDERS = new Set([
  'your_private_integration_token',
  'your_private_token',
  'your_location_id',
  '',
]);

export class GHLError extends Error {
  constructor(message, { status, url, method, body } = {}) {
    super(message);
    this.name = 'GHLError';
    this.status = status;
    this.url = url;
    this.method = method;
    this.body = body;
  }
}

export class GHLClient {
  /**
   * @param {object} [opts]
   * @param {string} [opts.token]       Private Integration token (defaults to process.env.GHL_TOKEN)
   * @param {string} [opts.locationId]  GoHighLevel Sub-Account ID (defaults to process.env.GHL_LOCATION_ID)
   * @param {string} [opts.baseUrl]     API base URL
   * @param {string} [opts.apiVersion]  API Version header (default: "2021-07-28")
   * @param {number} [opts.maxRetries]  Max retries on HTTP 429 (default: 4)
   */
  constructor(opts = {}) {
    this.token = String(opts.token ?? process.env.GHL_TOKEN ?? '').trim();
    this.locationId = String(opts.locationId ?? process.env.GHL_LOCATION_ID ?? '').trim();
    this.baseUrl = (opts.baseUrl ?? process.env.GHL_BASE_URL ?? 'https://services.leadconnectorhq.com').replace(/\/+$/, '');
    this.apiVersion = opts.apiVersion ?? process.env.GHL_API_VERSION ?? '2021-07-28';
    this.maxRetries = opts.maxRetries ?? 4;

    if (!this.token || PLACEHOLDERS.has(this.token)) {
      throw new GHLError('Missing or invalid GHL_TOKEN. Please set your Private Integration Token in .env');
    }
    if (!this.locationId || PLACEHOLDERS.has(this.locationId)) {
      throw new GHLError('Missing or invalid GHL_LOCATION_ID. Please set your Location ID in .env');
    }
  }

  /**
   * Base HTTP request handler.
   */
  async request(method, path, opts = {}) {
    const { query, body, version, headers: extraHeaders } = opts;

    const url = new URL(this.baseUrl + (path.startsWith('/') ? path : `/${path}`));
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v === undefined || v === null || v === '') continue;
        if (Array.isArray(v)) v.forEach((item) => url.searchParams.append(k, item));
        else url.searchParams.set(k, v);
      }
    }

    const headers = {
      Authorization: this.token.startsWith('Bearer ') ? this.token : `Bearer ${this.token}`,
      Version: version ?? this.apiVersion,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...extraHeaders,
    };

    let attempt = 0;
    while (true) {
      let res;
      try {
        res = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });
      } catch (networkErr) {
        throw new GHLError(`Network error calling ${method} ${url}: ${networkErr.message}`, {
          method,
          url: url.toString(),
        });
      }

      // Handle HTTP 429 Rate Limiting with exponential backoff
      if (res.status === 429 && attempt < this.maxRetries) {
        const retryAfter = Number(res.headers.get('Retry-After'));
        const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : Math.min(1000 * 2 ** attempt, 8000);
        attempt += 1;
        await sleep(waitMs);
        continue;
      }

      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = text;
      }

      if (!res.ok) {
        const apiMsg =
          (data && (data.message || data.error || data.msg)) ||
          (typeof data === 'string' ? data : '') ||
          res.statusText;

        throw new GHLError(`GHL API ${res.status}: ${apiMsg}`, {
          status: res.status,
          url: url.toString(),
          method,
          body: data,
        });
      }

      return data;
    }
  }

  get(path, opts) { return this.request('GET', path, opts); }
  post(path, body, opts) { return this.request('POST', path, { ...opts, body }); }
  put(path, body, opts) { return this.request('PUT', path, { ...opts, body }); }
  delete(path, opts) { return this.request('DELETE', path, opts); }

  // ---------------------------------------------------------------------------
  //  Location Profile & Health
  // ---------------------------------------------------------------------------

  async getLocation() {
    return this.get(`/locations/${this.locationId}`);
  }

  async whoami() {
    try {
      const res = await this.getLocation();
      const loc = res?.location ?? res;
      return {
        ok: true,
        locationId: this.locationId,
        locationName: loc?.name || null,
        email: loc?.email || null,
        phone: loc?.phone || null,
        timezone: loc?.timezone || null,
      };
    } catch (err) {
      return {
        ok: false,
        locationId: this.locationId,
        error: err.message,
        status: err.status,
      };
    }
  }

  // ---------------------------------------------------------------------------
  //  Contacts
  // ---------------------------------------------------------------------------

  async listContacts({ limit = 20, startAfterId, startAfter, query } = {}) {
    return this.get('/contacts/', {
      query: { locationId: this.locationId, limit, startAfterId, startAfter, query },
    });
  }

  async getRecentContacts({ count = 10 } = {}) {
    const res = await this.listContacts({ limit: Math.min(count, 100) });
    const contacts = res?.contacts ?? [];
    return contacts.slice(0, count);
  }

  async searchContacts({ pageLimit = 20, query, ...filters } = {}) {
    return this.post(
      '/contacts/search',
      { locationId: this.locationId, pageLimit, query, ...filters },
      { version: 'v3' }
    );
  }

  async getContact(contactId) {
    return this.get(`/contacts/${contactId}`);
  }

  async createContact(data) {
    return this.post('/contacts/', { locationId: this.locationId, ...data });
  }

  async upsertContact(data) {
    return this.post('/contacts/upsert', { locationId: this.locationId, ...data });
  }

  async updateContact(contactId, data) {
    return this.put(`/contacts/${contactId}`, data);
  }

  async deleteContact(contactId) {
    return this.delete(`/contacts/${contactId}`);
  }

  // ---------------------------------------------------------------------------
  //  Opportunities / Pipelines
  // ---------------------------------------------------------------------------

  async getPipelines() {
    return this.get('/opportunities/pipelines', {
      query: { locationId: this.locationId },
    });
  }

  async searchOpportunities({ limit = 20, pipeline_id, status, ...rest } = {}) {
    return this.get('/opportunities/search', {
      query: { location_id: this.locationId, limit, pipeline_id, status, ...rest },
    });
  }

  async getOpportunity(opportunityId) {
    return this.get(`/opportunities/${opportunityId}`);
  }

  async createOpportunity(data) {
    return this.post('/opportunities/', { locationId: this.locationId, ...data });
  }

  async updateOpportunity(opportunityId, data) {
    return this.put(`/opportunities/${opportunityId}`, data);
  }

  async deleteOpportunity(opportunityId) {
    return this.delete(`/opportunities/${opportunityId}`);
  }

  // ---------------------------------------------------------------------------
  //  Calendars & Appointments
  // ---------------------------------------------------------------------------

  async listCalendars() {
    return this.get('/calendars/', {
      query: { locationId: this.locationId },
    });
  }

  async listAppointments({ calendarId, startDate, endDate } = {}) {
    return this.get('/calendars/events', {
      query: { locationId: this.locationId, calendarId, startDate, endDate },
    });
  }

  // ---------------------------------------------------------------------------
  //  Custom Fields & Tags
  // ---------------------------------------------------------------------------

  async getCustomFields(model = 'contact') {
    return this.get(`/locations/${this.locationId}/customFields`, {
      query: { model },
    });
  }

  async getTags() {
    return this.get(`/locations/${this.locationId}/tags`);
  }
}

export default GHLClient;
