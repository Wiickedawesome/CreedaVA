# Google Calendar Integration Setup Guide

## What Was Implemented

The booking form now:
- ✅ **Saves bookings to Cosmos DB** (`bookings` container)
- ✅ **Creates Google Calendar events automatically**
- ✅ **Sends calendar invites via email** to both you and the customer
- ✅ **Returns booking confirmation** with booking ID

---

## Setup Steps

### 1. Create Google Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google Calendar API**:
   - Navigation Menu → APIs & Services → Library
   - Search "Google Calendar API"
   - Click "Enable"

4. Create Service Account:
   - Navigation Menu → APIs & Services → Credentials
   - Click "Create Credentials" → "Service Account"
   - Name: `creedava-calendar-service`
   - Click "Create and Continue"
   - Skip optional steps, click "Done"

5. Create Service Account Key:
   - Click on the service account you just created
   - Go to "Keys" tab
   - Click "Add Key" → "Create New Key"
   - Select "JSON"
   - Download the JSON file

6. Extract credentials from JSON file:
   - Open the downloaded JSON file
   - Copy the `client_email` value
   - Copy the `private_key` value (entire thing including `-----BEGIN PRIVATE KEY-----`)

---

### 2. Share Your Google Calendar with Service Account

1. Open [Google Calendar](https://calendar.google.com/)
2. Find the calendar you want to use (or create new one)
3. Click the 3 dots next to calendar name → "Settings and sharing"
4. Scroll to "Share with specific people"
5. Click "Add people"
6. Paste the service account email (from step 6 above)
7. Set permission to **"Make changes to events"**
8. Click "Send"

---

### 3. Create Cosmos DB Container

Run this locally:

```bash
cd api
NODE_TLS_REJECT_UNAUTHORIZED=0 node -e "
const { CosmosClient } = require('@azure/cosmos');
const endpoint = process.env.COSMOS_ENDPOINT || 'https://localhost:8081';
const key = process.env.COSMOS_KEY || 'C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==';
const client = new CosmosClient({ endpoint, key });
const database = client.database('creedava');

(async () => {
  const { container } = await database.containers.createIfNotExists({
    id: 'bookings',
    partitionKey: { paths: ['/type'] }
  });
  console.log('✅ Bookings container created');
})();
"
```

---

### 4. Configure Environment Variables

#### Local Development (`api/local.settings.json`)

Add these to the `Values` section:

```json
{
  "Values": {
    "GOOGLE_CALENDAR_ID": "primary",
    "GOOGLE_SERVICE_ACCOUNT_EMAIL": "creedava-calendar-service@your-project.iam.gserviceaccount.com",
    "GOOGLE_PRIVATE_KEY": "-----BEGIN PRIVATE KEY-----\\nYourPrivateKeyHere\\n-----END PRIVATE KEY-----"
  }
}
```

**Important:** In the private key, replace actual newlines with `\\n`

#### Production (Azure Function App)

1. Go to Azure Portal → Function Apps → `creedava-api`
2. Go to Configuration → Application Settings
3. Add these settings:

| Name | Value |
|------|-------|
| `GOOGLE_CALENDAR_ID` | `primary` (or specific calendar ID) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `creedava-calendar-service@your-project.iam.gserviceaccount.com` |
| `GOOGLE_PRIVATE_KEY` | Your full private key (with `\\n` for newlines) |

4. Click **Save**

---

### 5. Install Dependencies

```bash
cd api
npm install
```

---

### 6. Test Locally

```bash
# Start the API
cd api
npm start

# In another terminal, test the endpoint
curl -X POST http://localhost:7071/api/submitBooking \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+1234567890",
    "company": "Test Co",
    "service": "Executive Assistance",
    "hasProvider": "No",
    "date": "2026-01-20",
    "time": "10:00",
    "timezone": "America/Belize"
  }'
```

Expected response:
```json
{
  "success": true,
  "bookingId": "booking_1234567890_abc123",
  "calendarEventId": "abc123xyz456",
  "calendarCreated": true,
  "message": "Booking confirmed! Calendar invite sent to your email."
}
```

---

### 7. Deploy to Production

```bash
git add -A
git commit -m "Add Google Calendar integration for bookings"
git push origin main
```

The GitHub Action will deploy automatically.

---

## How It Works

### When a user submits the booking form:

1. **Frontend** sends booking data to `/api/submitBooking`
2. **Backend** validates the data
3. **Google Calendar API** creates a calendar event with:
   - Title: "Consultation: [Name] - [Company]"
   - Duration: 30 minutes
   - Attendees: hello@creedava.com + customer email
   - Reminders: 1 day, 1 hour, and 30 min before
4. **Email invites** are sent automatically to both parties
5. **Cosmos DB** stores the booking record with:
   - Booking ID
   - Customer details
   - Calendar event ID
   - Status (pending)
6. **Frontend** shows success message with booking ID

---

## Viewing Bookings

### In Google Calendar
- Open [Google Calendar](https://calendar.google.com/)
- All bookings will appear on your calendar
- Click event to see customer details

### In Admin Dashboard (Future Enhancement)
You can create an admin page to view all bookings:

```typescript
// In /admin/bookings
const response = await authorizedFetch('/api/getAnalytics?table=bookings');
const bookings = await response.json();
```

---

## Troubleshooting

### "Calendar event creation failed"
- Check service account has access to calendar
- Verify private key is correct (with `\\n` not actual newlines)
- Check service account email is exact match

### "Booking saved but no calendar event"
- Check Azure Function logs for errors
- Verify Google Calendar API is enabled
- Test service account credentials locally first

### No email received
- Check spam folder
- Verify `sendUpdates: 'all'` is set in code
- Check service account has calendar access

---

## Next Steps (Optional)

1. **Create admin page** to view/manage bookings
2. **Add email templates** for prettier notifications
3. **Add webhook** for calendar event updates
4. **Add SMS notifications** via Twilio
5. **Add availability checking** to prevent double-booking

---

**Your booking form is now fully automated!** 🎉
