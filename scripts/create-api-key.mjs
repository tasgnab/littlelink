/**
 * Script to create an API key for a user
 * Usage: node scripts/create-api-key.js <userEmail> <keyName>
 */

import postgres from 'postgres';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  32
);

async function createApiKey() {
  const userEmail = process.argv[2];
  const keyName = process.argv[3] || 'GitHub Actions Key';

  if (!userEmail) {
    console.error('Error: User email is required');
    console.error('Usage: node scripts/create-api-key.js <userEmail> <keyName>');
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('Error: DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  let sql;
  try {
    // Connect to database
    sql = postgres(databaseUrl);
    console.log('Connected to database');

    // Find user by email
    const users = await sql`
      SELECT id, email FROM "user" WHERE email = ${userEmail}
    `;

    if (users.length === 0) {
      console.error(`Error: User with email ${userEmail} not found`);
      process.exit(1);
    }

    const user = users[0];
    console.log(`Found user: ${user.email}`);

    // Generate API key
    const key = `sk_${nanoid()}`;

    // Insert API key
    const result = await sql`
      INSERT INTO "apiKeys" (id, "userId", name, key, "createdAt")
      VALUES (gen_random_uuid(), ${user.id}, ${keyName}, ${key}, NOW())
      RETURNING id, name, key, "createdAt"
    `;

    const apiKey = result[0];

    console.log('\n✅ API Key created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Name: ${apiKey.name}`);
    console.log(`Key: ${apiKey.key}`);
    console.log(`Created: ${apiKey.createdAt}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  Save this key securely - it will not be shown again!');
    console.log('\nUsage:');
    console.log(`  curl -H "Authorization: Bearer ${apiKey.key}" https://your-domain.com/api/links`);

    // Output key in a format that GitHub Actions can capture
    if (process.env.GITHUB_ACTIONS) {
      console.log(`\n::set-output name=api_key::${apiKey.key}`);
    }

  } catch (error) {
    console.error('Error creating API key:', error.message);
    process.exit(1);
  } finally {
    if (sql) {
      await sql.end();
    }
  }
}

createApiKey();
