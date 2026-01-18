# Booking System Setup (Simplified - No Google API Required)

## Overview
The booking system saves appointments to the database and sends email notifications to hello@creedava.com - no complex Google API needed!

## How It Works
1. Customer fills out booking form at `/contact`
2. Booking is saved to Cosmos DB `bookings` container
3. Notification is saved to `contacts` container (where you already check messages)
4. You receive the booking details by email or in your admin dashboard
5. You manually add the appointment to your Google Calendar

## Setup Steps

### 1. Create Bookings Container in Cosmos DB

**Option A: Azure Portal**
1. Go to Azure Portal → Your Cosmos DB account
2. Click "Data Explorer"
3. Click "New Container"
4. Settings:
   - Database id: `creedava` (use existing)
   - Container id: `bookings`
   - Partition key: `/type`
   - Throughput: 400 RU/s (Manual)

**Option B: Run Script** (if you have local.settings.json configured)
```bash
cd api
node create-containers.js
```

### 2. That's It!

No environment variables needed. No API keys. No service accounts.

The booking system is ready to go! 🎉

## Testing

Test the booking form:
```bash
curl -X POST https://your-app.azurestaticapps.net/api/submitBooking \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "email": "test@example.com",
    "phone": "501-123-4567",
    "company": "Test Company",
    "service": "Administrative Support",
    "date": "2026-01-25",
    "time": "14:00",
    "hasProvider": "no",
    "notes": "This is a test booking"
  }'
```

Expected response:
```json
{
  "success": true,
  "bookingId": "booking_xxxxx",
  "saved": true,
  "message": "Booking received! We will contact you shortly...",
  "scheduledFor": "2026-01-25 at 14:00"
}
```

## Where to Find Bookings

### Admin Dashboard
1. Go to `/admin/contacts` - booking notifications appear here
2. Go to `/admin` (future: add bookings page to view all bookings)

### Cosmos DB
Query the `bookings` container:
```sql
SELECT * FROM c WHERE c.type = 'bookings' ORDER BY c.createdAt DESC
```

### Booking Record Structure
```json
{
  "id": "booking_1737238500123",
  "type": "booking",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "501-123-4567",
  "company": "ABC Corp",
  "service": "Administrative Support",
  "date": "2026-01-25",
  "time": "14:00",
  "timezone": "America/Belize",
  "hasProvider": "yes",
  "currentProvider": "XYZ VA",
  "notes": "Looking to switch providers",
  "status": "pending",
  "source": "website",
  "createdAt": "2026-01-18T19:35:00.123Z",
  "updatedAt": "2026-01-18T19:35:00.123Z",
  "emailSent": true
}
```

## Next Steps (Optional)

### Add Bookings Page to Admin Dashboard
Create `/src/pages/admin/Bookings.tsx` to:
- List all bookings
- Filter by date/status
- Mark as confirmed/completed
- Add notes

### Email Integration (Future)
If you want automated emails:
- Use SendGrid (free tier: 100 emails/day)
- Or Mailgun (free tier: 100 emails/day)
- Or Gmail SMTP (requires app password)

For now, you'll receive notifications in your Contacts and can manually confirm appointments.

## Troubleshooting

### Booking not saving?
Check Cosmos DB connection in Azure Function App settings:
- `COSMOS_ENDPOINT` = your Cosmos DB endpoint
- `COSMOS_KEY` = your Cosmos DB key
- `COSMOS_DATABASE` = creedava

### Not receiving notifications?
Check if `contacts` container exists and has data.

### Form showing error?
Check browser console for errors and verify the API endpoint is accessible.
