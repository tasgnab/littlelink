# Vercel Cron Jobs

This directory contains API endpoints that are automatically triggered by Vercel Cron Jobs.

## Update GeoLite2 Database (`/api/cron/update-geodb`)

Automatically updates the MaxMind GeoLite2 database weekly.

### Configuration

**Schedule:** Every Sunday at 2:00 AM UTC
```
0 2 * * 0
```

Configured in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/update-geodb",
      "schedule": "0 2 * * 0"
    }
  ]
}
```

### Required Environment Variables

- `CRON_SECRET` - Automatically set by Vercel, used to authenticate cron requests
- `MAXMIND_LICENSE_KEY` - Your MaxMind license key
- `BLOB_READ_WRITE_TOKEN` - Your Vercel Blob storage token

### What It Does

1. Downloads the latest GeoLite2-City database from MaxMind (~70MB tar.gz)
2. Extracts the .mmdb file from the archive
3. Deletes the old database from Vercel Blob
4. Uploads the new database to Vercel Blob
5. Returns a JSON response with the result

### Testing Locally

To test the cron endpoint locally:

```bash
# Set a local CRON_SECRET for testing
export CRON_SECRET="your-test-secret"

# Make a request with the secret
curl -X GET http://localhost:3000/api/cron/update-geodb \
  -H "Authorization: Bearer your-test-secret"
```

**Note:** Local testing requires:
- `MAXMIND_LICENSE_KEY` in your `.env` file
- `BLOB_READ_WRITE_TOKEN` in your `.env` file
- May take 2-5 minutes to complete

### Response Format

**Success:**
```json
{
  "success": true,
  "message": "GeoLite2 database updated successfully",
  "blobUrl": "https://...",
  "size": "72.45 MB",
  "timestamp": "2025-12-06T02:00:00.000Z"
}
```

**Error:**
```json
{
  "error": "Failed to update GeoLite2 database",
  "message": "Error details..."
}
```

### Monitoring

- Check Vercel deployment logs to see cron execution logs
- Look for the "Vercel Cron: Update GeoLite2 Database" header in logs
- Monitor for errors and adjust as needed

### Security

- Only requests from Vercel Cron with the correct `CRON_SECRET` are accepted
- Returns 401 Unauthorized if the secret doesn't match
- All requests must include `Authorization: Bearer <CRON_SECRET>` header

### Troubleshooting

**Cron not running:**
- Ensure `vercel.json` is deployed with your project
- Check Vercel dashboard → Settings → Cron Jobs
- Verify environment variables are set in Vercel

**Authentication errors:**
- `CRON_SECRET` is automatically set by Vercel, don't override it
- Check Vercel logs for authentication failures

**Download/upload failures:**
- Verify `MAXMIND_LICENSE_KEY` is valid
- Verify `BLOB_READ_WRITE_TOKEN` has write permissions
- Check Vercel function logs for detailed error messages
- Ensure function has enough time (5 min timeout configured)
