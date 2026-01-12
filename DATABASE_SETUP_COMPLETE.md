# 🔧 Database Setup Complete - Quick Start Guide

## ✅ Issues Fixed

1. **Created missing `api/create-containers.js`** - Script to initialize all 14 Cosmos DB containers
2. **Created `scripts/start-cosmos-emulator.sh`** - Helper to start/check Cosmos emulator  
3. **Created `scripts/stop-cosmos-emulator.sh`** - Helper to stop emulator
4. **Created `api/reset-containers.js`** - Destructive script to reset all containers (dev only)
5. **Updated `.env.local`** - Configured with `VITE_DEV_MODE=true` for local development
6. **Updated `api/local.settings.json`** - Set `ALLOW_DEV_TOKEN=true` and configured for production Cosmos DB
7. **Created all 14 containers** in your production Cosmos DB successfully

## 🚀 How to Start Your Development Environment

### Option 1: Production Cosmos DB (Recommended - Current Setup)

This is configured and ready to go:

```bash
# Terminal 1: Start API
cd api
func start

# Terminal 2: Start Frontend
npm run dev
```

**Access your app:**
- Frontend: http://localhost:5173
- Admin: http://localhost:5173/admin
- API: http://localhost:7071/api

**Login to Admin:**
- Enter any email address (dev mode bypass)
- No password needed
- You'll get a "dev-token" that the API accepts

### Option 2: Local Cosmos Emulator (Optional)

If you want to use the local emulator instead of production:

```bash
# Step 1: Start emulator
npm run start:cosmos

# Step 2: Update api/local.settings.json:
# Change:
#   "COSMOS_ENDPOINT": "https://creedava-db.documents.azure.com:443/"
#   "USE_COSMOS_EMULATOR": "false"
# To:
#   "COSMOS_ENDPOINT": "https://localhost:8081"
#   "USE_COSMOS_EMULATOR": "true"

# Step 3: Create containers
npm run setup:db

# Step 4: Start API & Frontend
cd api && func start  # Terminal 1
npm run dev           # Terminal 2
```

**Note:** The emulator sometimes has issues. If you get "high demand" errors, use production Cosmos DB instead (Option 1).

## 📋 Database Containers Created

All 14 containers with partition key `/type`:

1. **contacts** - Contact form submissions
2. **leads** - Lead pipeline management
3. **tasks** - Task tracking
4. **projects** - Project management
5. **emails** - Email campaigns
6. **seo** - SEO content
7. **keywords** - Keyword tracking
8. **socialmedia** - Social media posts
9. **adcampaigns** - Ad campaigns
10. **blog** - Blog posts
11. **landingpages** - Landing pages
12. **customerjourney** - Customer journeys
13. **reports** - Reports
14. **analytics** - Analytics events

## 🔑 Authentication Settings

**Current Configuration (Dev Mode):**
- **Frontend:** `VITE_DEV_MODE=true` in `.env.local`
- **Backend:** `ALLOW_DEV_TOKEN=true` in `api/local.settings.json`

**How Dev Mode Works:**
1. Frontend login accepts any email (no password)
2. Frontend sends `Bearer dev-token` to API
3. API accepts `dev-token` when `ALLOW_DEV_TOKEN=true`
4. You can access admin panel without Entra ID setup

**To Use Real Entra ID Auth:**
- Set `VITE_DEV_MODE=false` in `.env.local`
- Set `ALLOW_DEV_TOKEN=false` in `api/local.settings.json`
- Ensure AAD_CLIENT_ID and AAD_TENANT_ID are configured

## 🔍 Troubleshooting

### "Unauthorized" Error in Admin Panel
✅ **FIXED** - This was caused by:
1. API not running (port 7071 not responding)
2. Missing dev mode configuration
3. Missing database containers

**Solution implemented:**
- Created all database containers
- Enabled dev mode in both frontend and backend
- API configured to accept dev tokens

### API Not Starting
```bash
# Check if API is running
curl http://localhost:7071/api/health

# If not, start it
cd api
func start
```

### Frontend Connection Issues
```bash
# Check .env.local has correct settings
cat .env.local | grep VITE_DEV_MODE  # Should be "true"

# Restart frontend
npm run dev
```

### Database Connection Issues
```bash
# Test connection to production Cosmos
curl -k https://creedava-db.documents.azure.com:443/

# Or check if emulator is running (if using emulator)
docker ps | grep cosmos
```

## 📝 Available Scripts

```bash
# Database
npm run setup:db          # Create containers in Cosmos DB
npm run start:cosmos      # Start Cosmos emulator (Docker)
npm run stop:cosmos       # Stop Cosmos emulator

# Development
npm run dev               # Start frontend (Vite)
npm run dev:api           # Start API (Functions)
npm run dev:full          # Start both (concurrently)

# Build
npm run build             # Build both app and widget
npm run build:app         # Build React app only
npm run build:widget      # Build embeddable widget
```

## 🎯 Next Steps

1. **Start your development servers** (see Option 1 above)
2. **Navigate to http://localhost:5173/admin**
3. **Login with any email** (dev mode - no password needed)
4. **Create some test data** in the admin panels
5. **Verify data persists** in Cosmos DB

## 📚 Files Created/Modified

**New Files:**
- `api/create-containers.js` - Database setup script
- `api/reset-containers.js` - Database reset script (destructive)
- `scripts/start-cosmos-emulator.sh` - Emulator start helper
- `scripts/stop-cosmos-emulator.sh` - Emulator stop helper

**Modified Files:**
- `.env.local` - Added `VITE_DEV_MODE=true` and full configuration
- `api/local.settings.json` - Set `ALLOW_DEV_TOKEN=true` for dev mode

## ⚠️ Important Notes

1. **Production Cosmos DB** is currently configured. Your local development will write to production database.
2. **Dev mode** bypasses Entra ID authentication - disable in production!
3. **COSMOS_KEY** in `local.settings.json` is your production key - keep it secure!
4. To isolate development from production, use the Cosmos emulator (Option 2) or create a separate dev database in Azure.

---

**Everything is now set up and ready to use!** 🎉

Run the commands in Option 1 and your database will work correctly.
