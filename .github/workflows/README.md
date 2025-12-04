# GitHub Workflows

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
