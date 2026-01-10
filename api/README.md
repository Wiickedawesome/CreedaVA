# CreedaVA API - Azure Functions Backend

Serverless API backend for CreedaVA CRM and marketing platform, built with Azure Functions (Node.js) and Azure Cosmos DB.

## 🚀 Features

- **Comprehensive Admin API** - Full CRUD operations for all entities (leads, contacts, tasks, projects, emails, etc.) secured with Entra ID bearer tokens
- **Contact Form Handler** - Process contact form submissions
- **Analytics Tracking** - Event tracking and analytics data retrieval
- **Cosmos DB Integration** - NoSQL database using `/type` as the partition key
- **CORS Configurable** - Origin comes from `CORS_ORIGIN`/`APP_ORIGIN`

## 📦 API Endpoints

### Admin CRUD Operations

All admin entities support GET, POST, PUT, and DELETE operations (require `Authorization: Bearer <id_token>` from Entra ID):

- **Leads** - `/api/getLeads`, `/api/createLeads`, `/api/updateLeads/{id}`, `/api/deleteLeads/{id}`
- **Contacts** - `/api/getContacts`, `/api/createContacts`, `/api/updateContacts/{id}`, `/api/deleteContacts/{id}`
- **Tasks** - `/api/getTasks`, `/api/createTasks`, `/api/updateTasks/{id}`, `/api/deleteTasks/{id}`
- **Projects** - `/api/getProjects`, `/api/createProjects`, `/api/updateProjects/{id}`, `/api/deleteProjects/{id}`
- **Emails** - `/api/getEmails`, `/api/createEmails`, `/api/updateEmails/{id}`, `/api/deleteEmails/{id}`
- **SEO Content** - `/api/getSeo`, `/api/createSeo`, `/api/updateSeo/{id}`, `/api/deleteSeo/{id}`
- **Keywords** - `/api/getKeywords`, `/api/createKeywords`, `/api/updateKeywords/{id}`, `/api/deleteKeywords/{id}`
- **Social Media** - `/api/getSocial`, `/api/createSocial`, `/api/updateSocial/{id}`, `/api/deleteSocial/{id}`
- **Blog Posts** - `/api/getBlog`, `/api/createBlog`, `/api/updateBlog/{id}`, `/api/deleteBlog/{id}`
- **Ad Campaigns** - `/api/getCampaigns`, `/api/createCampaigns`, `/api/updateCampaigns/{id}`, `/api/deleteCampaigns/{id}`
- **Landing Pages** - `/api/getLandingPages`, `/api/createLandingPages`, `/api/updateLandingPages/{id}`, `/api/deleteLandingPages/{id}`
- **Customer Journeys** - `/api/getCustomerJourneys`, `/api/createCustomerJourneys`, `/api/updateCustomerJourneys/{id}`, `/api/deleteCustomerJourneys/{id}`

### Public Endpoints

- `POST /api/submitContact` - Submit contact form
- `POST /api/trackEvent` - Track analytics event
- `GET /api/getAnalytics` - Retrieve analytics data

## 🛠️ Local Development

### Prerequisites

- Node.js 20+
- Azure Functions Core Tools (`npm install -g azure-functions-core-tools@4`)
- Docker Desktop (for Cosmos DB Emulator)

### Setup

1. **Install dependencies**
```bash
npm install
```

2. **Configure environment**

Copy `local.settings.json.example` to `local.settings.json`:
```json
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsStorage": "",
    "COSMOS_ENDPOINT": "https://localhost:8081",
    "COSMOS_KEY": "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==",
    "COSMOS_DATABASE": "CreedaVA",
    "APP_ORIGIN": "http://localhost:5173",
    "CORS_ORIGIN": "http://localhost:5173",
    "ALLOW_INMEMORY_FALLBACK": "false",
    "AAD_CLIENT_ID": "77207644-cbca-4d8f-b6f0-a9b077ba0f46",
    "AAD_TENANT_ID": "9c5238b8-3203-42de-a5c6-d401fa735fd5"
  },
  "Host": {
    "CORS": "http://localhost:5173",
    "CORSCredentials": false
  }
}
```

3. **Start Cosmos DB Emulator**
```bash
docker run -d \
  --name cosmosdb-emulator \
  -p 8081:8081 \
  -p 10251-10254:10251-10254 \
  -e AZURE_COSMOS_EMULATOR_PARTITION_COUNT=10 \
  -e AZURE_COSMOS_EMULATOR_ENABLE_DATA_PERSISTENCE=true \
  -v cosmos-data:/tmp/cosmos \
  mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:latest
```

4. **Initialize database containers**
```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 node create-containers.js
```

5. **Start Functions host**
```bash
npm start
# or
func start
```

API will be available at `http://localhost:7071/api/*`

## 📁 Project Structure

```
api/
├── adminApi/              # Comprehensive CRUD API
│   └── index.js          # All admin endpoints
├── submitContact/         # Contact form handler
│   └── index.js
├── trackEvent/            # Analytics event tracker
│   └── index.js
├── getAnalytics/          # Analytics data retrieval
│   └── index.js
├── shared/                # Shared utilities
│   └── cosmos.js         # Cosmos DB client
├── create-containers.js   # Database initialization
├── host.json             # Functions host configuration
├── local.settings.json   # Local environment config
└── package.json          # Dependencies
```

## 🗄️ Database Schema

### Container Structure

All containers use `/type` as the partition key:

- **leads** - Lead tracking and management
- **contacts** - Contact information
- **tasks** - Task management
- **projects** - Project tracking
- **emails** - Email campaign management
- **seo** - SEO content
- **keywords** - Keyword tracking
- **socialmedia** - Social media posts
- **blog** - Blog articles
- **adcampaigns** - Advertising campaigns
- **landingpages** - Landing page management
- **customerjourney** - Customer journey mapping

### Document Format

All documents include:
```json
{
  "id": "entity-timestamp-randomid",
  "type": "entityType",
  "userId": "admin",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601",
  ...entity-specific fields
}
```

## 🚀 Deployment

### Azure Functions Deployment

1. Create Azure Functions App
2. Configure Application Settings with production Cosmos DB credentials
3. Deploy using Azure CLI or GitHub Actions

```bash
func azure functionapp publish <YOUR_FUNCTION_APP_NAME>
```

### Environment Variables (Production)

Set in Azure Portal → Function App → Configuration:
- `COSMOS_ENDPOINT` - Production Cosmos DB endpoint
- `COSMOS_KEY` - Production Cosmos DB key
- `COSMOS_DATABASE` - Database name (CreedaVA)

## 🔒 Security

- CORS restricted to configured origins (see `CORS_ORIGIN`/`APP_ORIGIN`)
- Environment variables for sensitive data
- SSL/TLS encryption for all connections
- Automatic connection retry and failover

## 🔍 Diagnostics

- Inspect the Functions diagnostic string when latency is high or status codes are unexpected; it includes RU charge and activity IDs for Cosmos operations.
- Honor `Retry-After` on `429` responses from Cosmos DB; client and Functions calls should back off accordingly.

## 📝 License

© 2026 CreedaVA. All rights reserved.
