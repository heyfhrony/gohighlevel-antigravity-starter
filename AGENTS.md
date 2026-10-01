# AGENTS.md — Antigravity Agent Guidelines

This repository is a GoHighLevel (GHL) Sub-Account integration boilerplate designed to run directly with Google Antigravity or Node.js.

## Workspace Context & Architecture

- **Credentials**: Loaded from `.env` directly in `src/client.js`:
  - `GHL_TOKEN`: GoHighLevel Private Integration Bearer Token (sub-account scoped).
  - `GHL_LOCATION_ID`: The Sub-Account Location ID.
- **Client**: Located at `src/client.js` (`GHLClient`).
  - **DO NOT** rewrite HTTP fetch calls, custom headers, or rate-limiting logic. Always reuse `GHLClient`.
  - The client automatically injects `locationId` into all location-scoped endpoints and sets `Version: 2021-07-28` (or `v3` for contact searches).
  - Built-in automatic retry handles HTTP 429 rate limits.
- **CLI / Runner**: Located at `src/index.js` (executable via `node src/index.js <command>`).
- **Example**: Located at `example.js` (`node example.js` or `npm run example`).

## How to Interact with GoHighLevel in Code

```javascript
import { GHLClient } from './src/client.js';

const ghl = new GHLClient(); // Automatically reads .env

// Verify connection
const identity = await ghl.whoami();

// Retrieve recent contacts
const contacts = await ghl.getRecentContacts({ count: 10 });

// Search contacts
const searchResults = await ghl.searchContacts({ query: 'Jane', pageLimit: 10 });

// Create / Upsert contact (requires contacts.write)
const contact = await ghl.upsertContact({
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  phone: '+15551234567',
  tags: ['lead'],
});

// Opportunities & Pipelines
const pipelines = await ghl.getPipelines();
const opps = await ghl.searchOpportunities({ limit: 10 });

// Calendars
const calendars = await ghl.listCalendars();
```

## Agent Behavior & Safety Rules

1. **Verify Connection First**: When troubleshooting or starting a new session, run `node src/index.js whoami` to ensure credentials in `.env` are valid.
2. **Never Commit Secrets**: Do not modify `.gitignore` to track `.env` or write raw API tokens into tracked files.
3. **Confirm Write Operations**: When performing write/delete operations (e.g., deleting contacts, mass updates), verify user intent or confirm the payload with the user beforehand.
4. **Scope Awareness**: If an API call fails with HTTP 403, advise the user that their Private Integration token needs the corresponding `.write` scope enabled in GoHighLevel Settings -> Private Integrations.
