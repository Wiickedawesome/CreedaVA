# Cosmos DB Setup Guide

## Overview
The CreedaVA website now tracks analytics and contact form submissions using Azure Cosmos DB through Azure Functions.

## Azure Resources Required

### 1. Azure Cosmos DB Account
- **Service**: Azure Cosmos DB (NoSQL API)
- **Database Name**: `website-data`
- **Containers**:
  - `analytics` - Stores page views, button clicks, and event tracking
  - `contacts` - Stores contact form submissions
  - `linkedin-data` - Stores LinkedIn integration data (future use)

### 2. Container Configuration

#### Analytics Container
```json
{
  "id": "analytics",
  "partitionKey": "/type",
  "defaultTtl": 7776000
}
```
- **TTL**: 90 days (automatic cleanup of old analytics data)
- **Partition Key**: `/type` (values: "event", "page_view", etc.)

#### Contacts Container
```json
{
  "id": "contacts",
  "partitionKey": "/type",
  "defaultTtl": -1
}
```
- **TTL**: Disabled (keep contact data indefinitely)
- **Partition Key**: `/type` (value: "contact-form")

## GitHub Secrets Setup

Add the following secrets to your GitHub repository:

1. **COSMOS_ENDPOINT**
   - Navigate to: Azure Portal → Your Cosmos DB Account → Keys
   - Copy: **URI** value
   - Example: `https://creedava-db.documents.azure.com:443/`

2. **COSMOS_KEY**
   - Navigate to: Azure Portal → Your Cosmos DB Account → Keys
   - Copy: **PRIMARY KEY** value
   - ⚠️ Keep this secret - never commit to code

### Setting Secrets in GitHub
```bash
# Via GitHub CLI
gh secret set COSMOS_ENDPOINT --body "https://your-account.documents.azure.com:443/"
gh secret set COSMOS_KEY --body "your-primary-key-here"

# Or via GitHub UI:
# Settings → Secrets and variables → Actions → New repository secret
```

## Azure Static Web Apps Configuration

The environment variables are automatically injected during deployment via the GitHub Actions workflow. The API functions will have access to:

- `COSMOS_ENDPOINT`
- `COSMOS_KEY`
- `COSMOS_DATABASE` (defaults to "website-data")
- `COSMOS_CONTAINER` (defaults to "analytics")

## Azure Functions Deployed

### 1. `/api/trackEvent` (POST)
Tracks custom events like page views, button clicks, form submissions.

**Request Body:**
```json
{
  "eventType": "page_view",
  "eventData": { "title": "Home Page" },
  "page": "/",
  "userAgent": "...",
  "referrer": "..."
}
```

### 2. `/api/submitContact` (POST)
Stores contact form submissions.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "company": "Acme Inc",
  "phone": "555-1234",
  "message": "Interested in services",
  "service": "Executive Support"
}
```

### 3. `/api/getAnalytics` (GET)
Retrieves analytics data (requires function key for security).

**Query Parameters:**
- `days` - Number of days to retrieve (default: 30)
- `eventType` - Filter by specific event type

## Testing Locally

1. Install Azure Functions Core Tools:
```bash
npm install -g azure-functions-core-tools@4
```

2. Create `api/local.settings.json`:
```json
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsStorage": "",
    "COSMOS_ENDPOINT": "https://your-account.documents.azure.com:443/",
    "COSMOS_KEY": "your-key-here",
    "COSMOS_DATABASE": "website-data",
    "COSMOS_CONTAINER": "analytics"
  }
}
```

3. Run the functions locally:
```bash
cd api
npm install
npm start
```

4. Test the endpoint:
```bash
curl -X POST http://localhost:7071/api/trackEvent \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "test",
    "eventData": {"test": true},
    "page": "/test"
  }'
```

## Data Privacy & Compliance

- **Data Retention**: Analytics data is automatically deleted after 90 days via TTL
- **Personal Data**: Contact forms contain PII - handle according to your privacy policy
- **CORS**: API functions allow cross-origin requests from your domain
- **Security**: Analytics endpoint is public, admin endpoint requires function key

## Monitoring

View your data in Azure Portal:
1. Navigate to your Cosmos DB account
2. Click "Data Explorer"
3. Expand `website-data` → Select container → Items

## Cost Optimization

- **Free Tier**: Azure Cosmos DB offers 1000 RU/s and 25 GB free
- **Autoscale**: Consider enabling autoscale for variable traffic
- **TTL**: Analytics data auto-deletes to save storage costs

## Troubleshooting

### "Cosmos DB not configured" message
- Check that GitHub secrets are set correctly
- Verify secrets are available in GitHub Actions workflow
- Check Azure Static Web Apps environment variables

### Data not appearing
1. Check Azure Functions logs in Azure Portal
2. Verify container names match configuration
3. Ensure partition key structure is correct
4. Check browser console for API errors

### Local development issues
- Ensure `local.settings.json` has correct credentials
- Run `npm install` in the `api` folder
- Check that Azure Functions Core Tools are installed
