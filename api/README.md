# CreedaVA Azure Functions API

Backend API for CreedaVA website - handles LinkedIn OAuth, token management, and Cosmos DB integration.

## Setup

### Prerequisites
- Node.js 18+
- Azure Functions Core Tools v4
- Azure Cosmos DB account

### Installation

```bash
cd api
npm install
```

### Configuration

1. Copy `local.settings.json.example` to `local.settings.json`
2. Fill in your Azure Cosmos DB and LinkedIn credentials:

```json
{
  "Values": {
    "COSMOS_ENDPOINT": "https://creedava-db.documents.azure.com:443/",
    "COSMOS_KEY": "your-cosmos-primary-key",
    "COSMOS_DATABASE": "website-data",
    "COSMOS_CONTAINER": "linkedin-data",
    "LINKEDIN_CLIENT_ID": "your-linkedin-client-id",
    "LINKEDIN_CLIENT_SECRET": "your-linkedin-client-secret",
    "LINKEDIN_REDIRECT_URI": "http://localhost:4280/api/linkedin-auth"
  }
}
```

### Get Cosmos DB Credentials

```bash
# Get Cosmos DB endpoint (already set in example)
az cosmosdb show -n creedava-db -g CreedaVA --query documentEndpoint -o tsv

# Get primary key
az cosmosdb keys list -n creedava-db -g CreedaVA --query primaryMasterKey -o tsv
```

### Create Cosmos DB Container

```bash
# Create database
az cosmosdb sql database create \
  --account-name creedava-db \
  --resource-group CreedaVA \
  --name website-data

# Create container for LinkedIn data
az cosmosdb sql container create \
  --account-name creedava-db \
  --resource-group CreedaVA \
  --database-name website-data \
  --name linkedin-data \
  --partition-key-path "/id" \
  --throughput 400
```

## Local Development

```bash
npm start
# API runs on http://localhost:4280
```

## API Endpoints

### `GET /api/linkedin-connect`
Generate LinkedIn OAuth URL
- Query: `state` (optional) - Organization ID

### `GET /api/linkedin-auth`
OAuth callback handler - exchanges code for tokens

### `GET /api/linkedin-posts`
Fetch LinkedIn posts (cached)
- Query: `org` - Organization ID (default: "default")
- Query: `refresh` - Force refresh from LinkedIn (default: false)

## Deployment

Deploy as Azure Functions or as Static Web Apps API:

```bash
# Deploy to Azure Functions
func azure functionapp publish creedava-func

# Or configure as part of Static Web App
# (functions in /api folder are auto-deployed with SWA)
```

## Environment Variables for Production

Set these in Azure Portal → Function App → Configuration:
- `COSMOS_ENDPOINT`
- `COSMOS_KEY`
- `COSMOS_DATABASE`
- `COSMOS_CONTAINER`
- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`
- `LINKEDIN_REDIRECT_URI`
