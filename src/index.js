#!/usr/bin/env node
// -----------------------------------------------------------------------------
//  GoHighLevel CLI (Sub-Account Boilerplate)
//
//  Usage:
//    node src/index.js <command> [options]
// -----------------------------------------------------------------------------

import { GHLClient, GHLError } from './client.js';

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) {
        flags[key] = true;
      } else {
        flags[key] = next;
        i++;
      }
    } else {
      positional.push(a);
    }
  }
  return { positional, flags };
}

function print(obj) {
  console.log(JSON.stringify(obj, null, 2));
}

const HELP = `GoHighLevel CLI — Sub-Account Boilerplate

Usage:
  node src/index.js <command> [options]

Commands:
  whoami                                Test connection and display Sub-Account details
  contacts:list [--limit N]             List contacts
  contacts:recent [--count N]           Show recent contacts (default: 10)
  contacts:get <contactId>              Get a single contact by ID
  contacts:create                       Create contact (--first, --last, --email, --phone, or --json)
  contacts:update <contactId>           Update contact (--json '{...}')
  contacts:delete <contactId>           Delete contact by ID
  pipelines:list                        List opportunity pipelines
  opportunities:list [--limit N]        List opportunities
  calendars:list                        List booking calendars
  tags:list                             List tags configured in this sub-account
  fields:list                           List custom fields in this sub-account

Options:
  --help                                Show this help menu
`;

async function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const command = positional[0];

  if (!command || flags.help) {
    console.log(HELP);
    return;
  }

  const client = new GHLClient();

  switch (command) {
    case 'whoami': {
      const info = await client.whoami();
      print(info);
      if (!info.ok) {
        process.exitCode = 1;
      }
      break;
    }

    case 'contacts:list': {
      const res = await client.listContacts({
        limit: Number(flags.limit) || 20,
      });
      print(res);
      break;
    }

    case 'contacts:recent': {
      const contacts = await client.getRecentContacts({
        count: Number(flags.count) || 10,
      });
      print(
        contacts.map((c) => ({
          id: c.id,
          name: [c.firstName, c.lastName].filter(Boolean).join(' ') || c.contactName || '(no name)',
          email: c.email,
          phone: c.phone,
          dateAdded: c.dateAdded,
        }))
      );
      break;
    }

    case 'contacts:get': {
      const id = positional[1];
      if (!id) throw new Error('Usage: contacts:get <contactId>');
      print(await client.getContact(id));
      break;
    }

    case 'contacts:create': {
      let data;
      if (flags.json) {
        data = JSON.parse(flags.json);
      } else {
        data = {
          firstName: flags.first,
          lastName: flags.last,
          email: flags.email,
          phone: flags.phone,
        };
      }
      print(await client.createContact(data));
      break;
    }

    case 'contacts:update': {
      const id = positional[1];
      if (!id) throw new Error('Usage: contacts:update <contactId> --json \'{...}\'');
      if (!flags.json) throw new Error('Provide fields via --json \'{...}\'');
      print(await client.updateContact(id, JSON.parse(flags.json)));
      break;
    }

    case 'contacts:delete': {
      const id = positional[1];
      if (!id) throw new Error('Usage: contacts:delete <contactId>');
      print(await client.deleteContact(id));
      break;
    }

    case 'pipelines:list': {
      print(await client.getPipelines());
      break;
    }

    case 'opportunities:list': {
      print(await client.searchOpportunities({ limit: Number(flags.limit) || 20 }));
      break;
    }

    case 'calendars:list': {
      print(await client.listCalendars());
      break;
    }

    case 'tags:list': {
      print(await client.getTags());
      break;
    }

    case 'fields:list': {
      print(await client.getCustomFields(flags.model || 'contact'));
      break;
    }

    default:
      console.error(`Unknown command: ${command}\n`);
      console.log(HELP);
      process.exitCode = 1;
  }
}

main().catch((err) => {
  if (err instanceof GHLError) {
    console.error(`\n[GHL API Error] ${err.message}`);
    if (err.status === 401) {
      console.error('  -> 401 Unauthorized: Your GHL_TOKEN in .env is invalid or expired.');
    }
    if (err.status === 403) {
      console.error('  -> 403 Forbidden: Your Private Integration token lacks the required scope (e.g. contacts.write) or GHL_LOCATION_ID is wrong.');
    }
    if (err.body) {
      console.error('  Details:', JSON.stringify(err.body, null, 2));
    }
  } else {
    console.error('\nError:', err.message);
  }
  process.exitCode = 1;
});
