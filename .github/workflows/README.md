# GitHub Workflows

This directory contains automated workflows for managing your LittleLink application.

## Available Workflows

1. [Create API Key](#create-api-key-workflow) - Generate read-only API keys
2. [Import Links from CSV](#import-links-from-csv-workflow) - Bulk import links

---

## Import Links from CSV Workflow

This workflow allows you to bulk import links from a CSV file into your LittleLink database.

### CSV Format

Your CSV file must include these columns:
- `shortCode` - The short URL identifier (required)
- `longUrl` - The destination URL (required)
- `title` - Display title (optional)
- `tags` - Pipe-separated tags (optional, e.g., `social|twitter|personal`)

Other columns will be ignored.

**Example CSV:**
```csv
createdAt,domain,shortCode,shortUrl,longUrl,title,tags,visits
2025-10-09T05:26:23+00:00,l.thopo.dev,ai-bootcamp,https://l.thopo.dev/ai-bootcamp,https://www.udemy.com/certificate/...,Udemy AI Bootcamp,certificate|udemy,4
2025-04-20T15:43:46+00:00,l.thopo.dev,threads,https://l.thopo.dev/threads,https://www.threads.net/@user,Find Me on Threads,littlelink|social|threads,20
```

### Setup

1. **Configure GitHub Secrets**
   - Navigate to: Repository → Settings → Secrets and variables → Actions
   - Add `DATABASE_URL` secret with your PostgreSQL connection string

2. **Configure Environments (Optional)**
   - Create environments: `production`, `staging`, `development`
   - Add environment-specific `DATABASE_URL` secrets

### Usage

#### Via GitHub Actions UI

1. Go to **Actions** tab
2. Select **Import Links from CSV** workflow
3. Click **Run workflow**
4. Fill in:
   - **User Email**: Email of the user (must exist in database)
   - **CSV Content**: Paste the entire CSV content including headers
   - **Environment**: Target environment
5. Click **Run workflow**
6. Check logs for import summary

#### Via GitHub CLI

```bash
# Prepare your CSV content
CSV_CONTENT=$(cat short_urls.csv)

# Run the workflow
gh workflow run import-links.yml \
  -f user_email="your-email@example.com" \
  -f csv_content="$CSV_CONTENT" \
  -f environment="production"

# Watch the workflow
gh run watch
```

### How It Works

1. **Validation**: Checks CSV format and required columns
2. **User Lookup**: Finds user by email in database
3. **Processing**: For each row:
   - Creates or updates link with shortCode, originalUrl, title
   - Parses tags (split by `|`)
   - Creates tags if they don't exist
   - Links tags to the link
4. **Summary**: Reports created, updated, and skipped items

### Behavior

- **Existing Links**: If a shortCode already exists, it will be updated
- **Tags**: Automatically creates missing tags with default blue color
- **Tag Assignment**: Replaces existing tag assignments for updated links
- **Skips**: Invalid rows (missing shortCode or longUrl) are skipped

### Local Testing

```bash
# Set DATABASE_URL
export DATABASE_URL="postgresql://user:password@host/database"

# Run import script
node scripts/import-links.mjs short_urls.csv your-email@example.com
```

### Security Notes

⚠️ **Important:**
- Only authorized users should have access to run workflows
- CSV content is temporarily stored during workflow execution
- Ensure DATABASE_URL is properly secured
- Validate CSV data before importing to production

### Troubleshooting

**Error: User with email X not found**
- User must have signed in at least once
- Email must match exactly (case-sensitive)

**Error: CSV must contain 'shortCode' column**
- Ensure CSV has proper headers
- Check column names match exactly

**Link creation failed**
- Check that shortCode follows validation rules (3-20 chars, alphanumeric/hyphen/underscore)
- Verify URL format is valid

---

## Create API Key Workflow

This workflow allows you to create API keys for your LittleLink application directly from GitHub Actions.

### Setup

1. **Configure GitHub Secrets**

   Navigate to your repository → Settings → Secrets and variables → Actions

   Add the following secret:
   - `DATABASE_URL` - Your PostgreSQL connection string

2. **Configure GitHub Environments (Optional)**

   For environment-specific secrets:
   - Go to Settings → Environments
   - Create environments: `production`, `staging`, `development`
   - Add `DATABASE_URL` secret to each environment with the appropriate connection string

### Usage

#### Via GitHub Actions UI

1. Go to **Actions** tab in your repository
2. Select **Create API Key** workflow
3. Click **Run workflow**
4. Fill in the inputs:
   - **User Email**: Email of the user (must match `ALLOWED_USER_EMAIL`)
   - **Key Name**: Descriptive name for the key (e.g., "CI/CD Key", "Analytics Tool")
   - **Environment**: Choose which environment's DATABASE_URL to use
5. Click **Run workflow**
6. Wait for the workflow to complete
7. Check the workflow logs for the generated API key
8. **Copy the API key immediately** - it will not be shown again!

#### Via GitHub CLI

```bash
# Install GitHub CLI if not already installed: https://cli.github.com/

# Run the workflow
gh workflow run create-api-key.yml \
  -f user_email="your-email@example.com" \
  -f key_name="My API Key" \
  -f environment="production"

# View the workflow run (get the run ID from the command above)
gh run view <run-id> --log

# Or watch it in real-time
gh run watch
```

### Local Testing

You can test the script locally:

```bash
# Set your DATABASE_URL
export DATABASE_URL="postgresql://user:password@host/database"

# Run the script
npm run create-api-key your-email@example.com "Test Key"

# Or directly with node
node scripts/create-api-key.mjs your-email@example.com "Test Key"
```

### Security Notes

⚠️ **Important Security Considerations:**

1. **API Key Visibility**: The API key is shown in the workflow logs. Make sure only authorized team members have access to view workflow runs.
2. **Read-Only Access**: API keys created this way have read-only access to your links and analytics.
3. **Store Securely**: Copy the API key immediately after creation and store it in a secure location (e.g., password manager, secrets management system).
4. **Revocation**: If a key is compromised, delete it immediately via the dashboard or API.
5. **Audit**: Regularly review your API keys and remove unused ones.

### Example Use Cases

- **CI/CD Pipeline**: Create a key for automated testing or monitoring
- **Analytics Dashboard**: Generate a key for an external analytics tool
- **Monitoring Tools**: Create keys for uptime monitoring services
- **Integration Testing**: Generate keys for integration test environments

### Troubleshooting

**Error: User with email X not found**
- Ensure the email matches a user in your database
- The email must match the `ALLOWED_USER_EMAIL` environment variable

**Error: DATABASE_URL environment variable is not set**
- Check that the secret is properly configured in GitHub Settings
- Verify the environment name matches your configuration

**Database connection failed**
- Verify the DATABASE_URL format is correct
- Ensure your database accepts connections from GitHub Actions IPs
- Check if your database requires IP whitelisting (some managed databases do)
