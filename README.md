# GoHighLevel ↔ Google Antigravity Boilerplate

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GoHighLevel API](https://img.shields.io/badge/GHL%20API-v2-orange.svg)](https://marketplace.gohighlevel.com/docs)

A universal, beginner-friendly starter boilerplate to connect **Google Antigravity** (or any Node.js application) directly to a **GoHighLevel Sub-Account** using a Private Integration Token and Location ID.

Designed specifically for managing **one Sub-Account**. Anyone can clone this repository, paste two credentials into `.env`, and start managing their CRM right away.

---

## 📺 Video Walkthrough

Watch the full setup and demo video here:

[![Watch the video](https://img.youtube.com/vi/XgqGUWnEz6U/maxresdefault.jpg)](https://youtu.be/XgqGUWnEz6U)

---

## 📋 Prerequisites

Before you start, make sure you have:
1. **Node.js 18 or higher** installed on your machine.  
   *(Check with `node -v` in your terminal. Download from [nodejs.org](https://nodejs.org/) if needed.)*
2. **A GoHighLevel Sub-Account** (administrator access to your location settings).
3. **Google Antigravity** (or any terminal/code editor).

---

## 🚀 Quick Start (Under 60 Seconds)

### Step 1: Clone and install dependencies
```bash
git clone https://github.com/heyfhrony/gohighlevel-antigravity-starter.git
cd gohighlevel-antigravity-starter
npm install
```

### Step 2: Create your `.env` file
Copy the `.env.example` file:
```bash
cp .env.example .env
```

Open `.env` in your text editor and paste your credentials:
```dotenv
GHL_TOKEN=pit-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
GHL_LOCATION_ID=your_subaccount_location_id
```

### Step 3: Verify your connection
```bash
npm run whoami
```

If your credentials are valid, it will output your Sub-Account details:
```json
{
  "ok": true,
  "locationId": "your_subaccount_location_id",
  "locationName": "Your Business Name",
  "email": "contact@yourbusiness.com",
  "phone": "+15551234567",
  "timezone": "America/New_York"
}
```

### Step 4: Run the quickstart example
```bash
npm run example
```

---

## 🔑 How to Get Your GoHighLevel Credentials

> [!IMPORTANT]
> Make sure you are inside your **Sub-Account** (Location view), **NOT** the agency view.

### 1. Location ID (`GHL_LOCATION_ID`)
There are two easy ways to find your Location ID:
- **Method A (URL)**: Look at your browser address bar while inside your sub-account:  
  `https://app.gohighlevel.com/v2/location/<YOUR_LOCATION_ID>/...`
- **Method B (Settings)**: In the left sidebar, click **Settings** → **Business Profile** → **General Information** → copy the **Location ID**.

### 2. Private Integration Token (`GHL_TOKEN`)
1. In your Sub-Account, go to **Settings** (bottom left).
2. Click **Private Integrations** in the left menu.  
   *(If you don't see "Private Integrations", go to **Settings → Labs** and toggle on **Private Integrations**).*
3. Click **+ Create Private Integration**.
4. Set a name (e.g. `Antigravity Integration`).
5. Select the scopes you need:
   - **Recommended Read Scopes**:
     - `contacts.readonly`
     - `opportunities.readonly`
     - `calendars.readonly`
   - **Recommended Write Scopes** (needed if you want to create/update contacts or deals):
     - `contacts.write`
     - `opportunities.write`
6. Click **Save**. Copy the generated Bearer Token (starts with `pit-...`) and paste it as `GHL_TOKEN` in your `.env`.

---

## 🤖 Using with Google Antigravity

This repository is preconfigured for **Google Antigravity**. It contains [`AGENTS.md`](./AGENTS.md), which tells the Antigravity AI agent how to automatically interact with your GoHighLevel sub-account using the built-in client.

### How to use:
1. Open this project folder in **Google Antigravity**.
2. Make sure your `.env` file has your `GHL_TOKEN` and `GHL_LOCATION_ID`.
3. In the chat, simply ask the assistant what you want to do in plain English!

### Example prompts to try:
- **List Contacts:**
  > *"Fetch my last 10 contacts and display their names, emails, and phone numbers in a table."*
- **Search Contacts:**
  > *"Search for any contact with the email 'customer@example.com' or phone number ending in 1234."*
- **Create Contact:**
  > *"Create a new contact named Alex Mercer, email alex@example.com, and add the tag 'website-lead'."*
- **Check Sales Pipelines:**
  > *"List all my pipelines and show me the opportunities currently in each stage."*
- **Check Appointments:**
  > *"List all booking calendars in my sub-account and check if there are appointments scheduled for this week."*
- **Custom Scripts:**
  > *"Write a script that syncs a list of leads from a CSV file into GoHighLevel contacts."*

---

## 💻 Built-in CLI Commands

You can test and inspect your Sub-Account anytime from your terminal:

```bash
# Check connection & account details
node src/index.js whoami

# List contacts (with limit)
node src/index.js contacts:list --limit 20

# View recent contacts
node src/index.js contacts:recent --count 10

# Get a single contact by ID
node src/index.js contacts:get <contactId>

# Create a contact using flags
node src/index.js contacts:create --first "John" --last "Doe" --email "john@example.com" --phone "+15551234567"

# Update a contact
node src/index.js contacts:update <contactId> --json '{"tags":["vip"]}'

# Delete a contact
node src/index.js contacts:delete <contactId>

# List opportunity pipelines & stages
node src/index.js pipelines:list

# List opportunities
node src/index.js opportunities:list --limit 10

# List booking calendars
node src/index.js calendars:list

# List custom fields and tags
node src/index.js tags:list
node src/index.js fields:list
```

---

## 🧑‍💻 Using in Your Own Code

You can import `GHLClient` in any JavaScript file:

```javascript
import { GHLClient } from './src/client.js';

// Initializes using GHL_TOKEN and GHL_LOCATION_ID from .env
const ghl = new GHLClient();

// 1. Fetch recent contacts
const contacts = await ghl.getRecentContacts({ count: 10 });
console.log(contacts);

// 2. Search contacts (uses GHL v3 search endpoint)
const searchResults = await ghl.searchContacts({ query: 'Jane', pageLimit: 5 });

// 3. Upsert contact (creates if new, updates if email/phone exists)
const contact = await ghl.upsertContact({
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  tags: ['new-lead'],
});

// 4. Raw API requests for any custom endpoint
const response = await ghl.get('/workflows/', {
  query: { locationId: ghl.locationId },
});
```

See [`example.js`](./example.js) for a working, ready-to-run demonstration.

---

## 📁 Project Structure

```
ghl-antigravity/
├── .env.example          # Clean credentials template
├── .gitignore            # Keeps your real .env secret
├── AGENTS.md             # Antigravity AI agent context and rules
├── README.md             # Complete user and setup documentation
├── example.js            # Runnable quickstart code sample
├── package.json          # Project metadata and npm scripts
└── src/
    ├── client.js         # GHLClient (HTTP wrapper, rate limit retries, API methods)
    └── index.js          # CLI command runner
```

---

## ❓ Troubleshooting & FAQs

### Q: Why do I get a `401 Unauthorized` error?
- Your `GHL_TOKEN` in `.env` is invalid, expired, or was copied with extra spaces. Make sure you copied the full Bearer token from **Settings → Private Integrations**.

### Q: Why do I get a `403 Forbidden` error?
- Your Private Integration token lacks the required permission scope for that action. For example:
  - If creating or updating contacts fails, make sure your token has **`contacts.write`**.
  - If creating opportunities fails, make sure your token has **`opportunities.write`**.
  - Go to **Settings → Private Integrations**, edit your integration, add the missing scopes, and save.

### Q: Where do I find "Private Integrations"?
- In GoHighLevel Sub-Account settings, look for **Private Integrations** in the left sidebar. If it is not visible, go to **Settings → Labs** and enable **"Private Integrations"**.

### Q: How are rate limits handled?
- GoHighLevel has rate limits (~100 requests per 10-second burst). `GHLClient` has built-in exponential backoff and automatically retries requests if a `429 Too Many Requests` is encountered.

---

## 📄 License

MIT License © 2026 [Farhad Hossen](https://farhadhossen.com). See [LICENSE](./LICENSE) for full details.
