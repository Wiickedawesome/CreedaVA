const { app } = require('@azure/functions');
const { CosmosClient } = require('@azure/cosmos');
const { google } = require('googleapis');
const { validateBearer } = require('../shared/auth');

// Initialize Cosmos DB client
const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
const databaseId = process.env.COSMOS_DATABASE || 'creedava';

let cosmosClient;
let database;
let bookingsContainer;

// Only initialize if Cosmos is configured
if (endpoint && key) {
  cosmosClient = new CosmosClient({ endpoint, key });
  database = cosmosClient.database(databaseId);
  bookingsContainer = database.container('bookings');
}

// Google Calendar API setup
const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

let calendarClient;
if (GOOGLE_SERVICE_ACCOUNT_EMAIL && GOOGLE_PRIVATE_KEY) {
  const auth = new google.auth.JWT(
    GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    GOOGLE_PRIVATE_KEY,
    ['https://www.googleapis.com/auth/calendar']
  );
  calendarClient = google.calendar({ version: 'v3', auth });
}

app.http('submitBooking', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'submitBooking',
  handler: async (request, context) => {
    context.log('Processing booking submission');

    try {
      const booking = await request.json();
      
      // Validate required fields
      const required = ['name', 'email', 'phone', 'company', 'service', 'date', 'time'];
      for (const field of required) {
        if (!booking[field]) {
          return {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': process.env.APP_ORIGIN || '*',
              'Access-Control-Allow-Credentials': 'true'
            },
            body: JSON.stringify({ 
              error: 'Missing required fields',
              message: `${field} is required`
            })
          };
        }
      }

      const timestamp = new Date().toISOString();
      const bookingId = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create booking record
      const bookingRecord = {
        id: bookingId,
        type: 'booking',
        ...booking,
        status: 'pending',
        createdAt: timestamp,
        updatedAt: timestamp
      };

      // Parse date and time for calendar event
      const [year, month, day] = booking.date.split('-');
      const [hour, minute] = booking.time.split(':');
      
      const startDateTime = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute)
      );
      
      const endDateTime = new Date(startDateTime.getTime() + 30 * 60000); // 30 min duration

      let calendarEventId = null;
      let calendarError = null;

      // Create Google Calendar event if configured
      if (calendarClient) {
        try {
          const event = {
            summary: `Consultation: ${booking.name} - ${booking.company}`,
            description: `
Consultation Call Details
========================
Name: ${booking.name}
Email: ${booking.email}
Phone: ${booking.phone}
Company: ${booking.company}

Service Interested: ${booking.service}
Current VA Provider: ${booking.hasProvider}
${booking.currentProvider ? `Provider Name: ${booking.currentProvider}` : ''}

Additional Notes:
${booking.notes || 'None'}

Status: Pending Confirmation
Booking ID: ${bookingId}
            `.trim(),
            start: {
              dateTime: startDateTime.toISOString(),
              timeZone: booking.timezone || 'America/Belize'
            },
            end: {
              dateTime: endDateTime.toISOString(),
              timeZone: booking.timezone || 'America/Belize'
            },
            attendees: [
              { email: 'hello@creedava.com', organizer: true },
              { email: booking.email, responseStatus: 'needsAction' }
            ],
            reminders: {
              useDefault: false,
              overrides: [
                { method: 'email', minutes: 24 * 60 }, // 1 day before
                { method: 'email', minutes: 60 },       // 1 hour before
                { method: 'popup', minutes: 30 }        // 30 min before
              ]
            },
            guestsCanModify: false,
            guestsCanInviteOthers: false,
            guestsCanSeeOtherGuests: true
          };

          const response = await calendarClient.events.insert({
            calendarId: GOOGLE_CALENDAR_ID,
            resource: event,
            sendUpdates: 'all' // Send email invites to attendees
          });

          calendarEventId = response.data.id;
          bookingRecord.calendarEventId = calendarEventId;
          bookingRecord.calendarLink = response.data.htmlLink;
          
          context.log('Calendar event created:', calendarEventId);
        } catch (error) {
          context.error('Calendar event creation failed:', error);
          calendarError = error.message;
          bookingRecord.calendarError = calendarError;
        }
      } else {
        context.warn('Google Calendar not configured - event not created');
        bookingRecord.calendarError = 'Google Calendar API not configured';
      }

      // Save to Cosmos DB if configured
      if (bookingsContainer) {
        try {
          await bookingsContainer.items.create(bookingRecord);
          context.log('Booking saved to database:', bookingId);
        } catch (dbError) {
          context.error('Database save failed:', dbError);
          // Continue even if DB save fails
        }
      }

      // Return success response
      return {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': process.env.APP_ORIGIN || '*',
          'Access-Control-Allow-Credentials': 'true'
        },
        body: JSON.stringify({
          success: true,
          bookingId: bookingId,
          calendarEventId: calendarEventId,
          calendarCreated: !!calendarEventId,
          message: calendarEventId 
            ? 'Booking confirmed! Calendar invite sent to your email.'
            : 'Booking received! We will send calendar invite shortly.',
          calendarError: calendarError || undefined
        })
      };

    } catch (error) {
      context.error('Booking submission error:', error);
      return {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': process.env.APP_ORIGIN || '*',
          'Access-Control-Allow-Credentials': 'true'
        },
        body: JSON.stringify({
          error: 'Internal server error',
          message: error.message
        })
      };
    }
  }
});

// Handle CORS preflight
app.http('submitBookingOptions', {
  methods: ['OPTIONS'],
  authLevel: 'anonymous',
  route: 'submitBooking',
  handler: async (request, context) => {
    return {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': process.env.APP_ORIGIN || '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400'
      }
    };
  }
});
