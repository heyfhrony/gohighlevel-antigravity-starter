import { GHLClient } from './src/client.js';

async function main() {
  const ghl = new GHLClient();

  // 1. Verify connection
  const me = await ghl.whoami();
  console.log(`Connected to: ${me.locationName} (${me.locationId})\n`);

  // 2. Fetch recent contacts
  const contacts = await ghl.getRecentContacts({ count: 5 });
  console.log(`Found ${contacts.length} recent contact(s):`);
  for (const c of contacts) {
    const name = [c.firstName, c.lastName].filter(Boolean).join(' ') || c.contactName || '(no name)';
    console.log(`- ${name.padEnd(24)} ${c.email ?? ''}  ${c.phone ?? ''}`);
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exitCode = 1;
});
