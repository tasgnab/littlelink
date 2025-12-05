/**
 * Script to import links from a CSV file
 * Usage: node scripts/import-links.mjs <csvFilePath> <userEmail>
 */

import postgres from 'postgres';
import { readFileSync } from 'fs';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  8
);

/**
 * Parse CSV file (simple parser for the specific format)
 */
function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Simple CSV parser (handles quoted fields)
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });

    data.push(row);
  }

  return data;
}

/**
 * Import links from CSV data
 */
async function importLinks(sql, userId, csvData) {
  let importedCount = 0;
  let skippedCount = 0;
  let updatedCount = 0;

  console.log(`\nProcessing ${csvData.length} links...`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  for (const row of csvData) {
    const shortCode = row.shortCode;
    const originalUrl = row.longUrl;
    const title = row.title || null;
    const tagString = row.tags || '';

    if (!shortCode || !originalUrl) {
      console.log(`⚠️  Skipping row: missing shortCode or longUrl`);
      skippedCount++;
      continue;
    }

    try {
      // Check if link already exists
      const existingLinks = await sql`
        SELECT id, "shortCode", "originalUrl", title
        FROM links
        WHERE "shortCode" = ${shortCode}
      `;

      let linkId;
      let isNew = existingLinks.length === 0;

      if (isNew) {
        // Create new link
        const result = await sql`
          INSERT INTO links (id, "userId", "shortCode", "originalUrl", title, "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), ${userId}, ${shortCode}, ${originalUrl}, ${title}, NOW(), NOW())
          RETURNING id, "shortCode"
        `;

        linkId = result[0].id;
        console.log(`✅ Created: ${shortCode} → ${originalUrl}`);
        importedCount++;
      } else {
        // Update existing link
        linkId = existingLinks[0].id;

        await sql`
          UPDATE links
          SET "originalUrl" = ${originalUrl},
              title = ${title},
              "updatedAt" = NOW()
          WHERE id = ${linkId}
        `;

        console.log(`🔄 Updated: ${shortCode} → ${originalUrl}`);
        updatedCount++;
      }

      // Handle tags if provided
      if (tagString) {
        const tagNames = tagString.split('|').map(t => t.trim()).filter(t => t);

        if (tagNames.length > 0) {
          // Delete existing link-tag associations
          await sql`
            DELETE FROM "linkTags" WHERE "linkId" = ${linkId}
          `;

          const tagIds = [];

          for (const tagName of tagNames) {
            // Check if tag exists
            let tagResult = await sql`
              SELECT id FROM tags WHERE "userId" = ${userId} AND name = ${tagName}
            `;

            let tagId;
            if (tagResult.length === 0) {
              // Create tag with default color
              const newTag = await sql`
                INSERT INTO tags (id, "userId", name, color, "createdAt")
                VALUES (gen_random_uuid(), ${userId}, ${tagName}, '#3b82f6', NOW())
                RETURNING id
              `;
              tagId = newTag[0].id;
            } else {
              tagId = tagResult[0].id;
            }

            tagIds.push(tagId);
          }

          // Create link-tag associations
          if (tagIds.length > 0) {
            for (const tagId of tagIds) {
              await sql`
                INSERT INTO "linkTags" ("linkId", "tagId")
                VALUES (${linkId}, ${tagId})
                ON CONFLICT DO NOTHING
              `;
            }
            console.log(`   📎 Tags: ${tagNames.join(', ')}`);
          }
        }
      }

    } catch (error) {
      console.error(`❌ Error processing ${shortCode}:`, error.message);
      skippedCount++;
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Import Summary:');
  console.log(`   ✅ Created: ${importedCount}`);
  console.log(`   🔄 Updated: ${updatedCount}`);
  console.log(`   ⚠️  Skipped: ${skippedCount}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

async function main() {
  const csvFilePath = process.argv[2];
  const userEmail = process.argv[3];

  if (!csvFilePath || !userEmail) {
    console.error('Error: CSV file path and user email are required');
    console.error('Usage: node scripts/import-links.mjs <csvFilePath> <userEmail>');
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
    console.log('✅ Connected to database');

    // Find user by email
    const users = await sql`
      SELECT id, email FROM "user" WHERE email = ${userEmail}
    `;

    if (users.length === 0) {
      console.error(`Error: User with email ${userEmail} not found`);
      console.error('Please ensure the user has signed in at least once.');
      process.exit(1);
    }

    const user = users[0];
    console.log(`✅ Found user: ${user.email}\n`);

    // Read and parse CSV file
    console.log(`📖 Reading CSV file: ${csvFilePath}`);
    const csvContent = readFileSync(csvFilePath, 'utf-8');
    const csvData = parseCSV(csvContent);
    console.log(`✅ Parsed ${csvData.length} rows from CSV\n`);

    // Import links
    await importLinks(sql, user.id, csvData);

    console.log('✅ Import completed successfully!\n');

  } catch (error) {
    console.error('❌ Error during import:', error.message);
    process.exit(1);
  } finally {
    if (sql) {
      await sql.end();
    }
  }
}

main();
