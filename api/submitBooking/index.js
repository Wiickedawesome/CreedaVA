const { app } = require('@azure/functions');
const { CosmosClient } = require('@azure/cosmos');
const { corsHeaders } = require('../shared/cors');

// Initialize Cosmos DB client
const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
const databaseId = process.env.COSMOS_DATABASE || 'creedava';

let cosmosClient;
let database;

// Only initialize if Cosmos is configured
if (endpoint && key) {
  cosmosClient = new CosmosClient({ endpoint, key });
  database = cosmosClient.database(databaseId);
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
            headers: corsHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ 
              error: 'Missing required fields',
              message: `${field} is required`
            })
          };
        }
      }

      const timestamp = new Date().toISOString();
      const bookingId = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Format the booking details for email
      const bookingDetails = `
New Consultation Booking Received
==================================

Customer Details:
-----------------
Name: ${booking.name}
Email: ${booking.email}
Phone: ${booking.phone}
Company: ${booking.company}

Booking Information:
--------------------
Service: ${booking.service}
Preferred Date: ${booking.date}
Preferred Time: ${booking.time} (${booking.timezone || 'America/Belize'})
Current VA Provider: ${booking.hasProvider}
${booking.currentProvider ? `Current Provider: ${booking.currentProvider}` : ''}

Additional Notes:
${booking.notes || 'None provided'}

Booking ID: ${bookingId}
Submitted: ${new Date(timestamp).toLocaleString()}

---
Please add this to your calendar and send a confirmation email to ${booking.email}
      `.trim();

      // Auto-create lead from booking (primary storage)
      let leadId = null;
      let dbSaved = false;
      try {
        const leadsContainer = database?.container('leads');
        if (leadsContainer) {
          leadId = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await leadsContainer.items.create({
            id: leadId,
            type: 'leads',
            name: booking.name,
            email: booking.email,
            phone: booking.phone,
            company: booking.company,
            service: booking.service,
            status: 'new',
            source: 'booking-form',
            notes: `Booking scheduled for ${booking.date} at ${booking.time}\n\nService: ${booking.service}\nHas Provider: ${booking.hasProvider}${booking.currentProvider ? `\nCurrent Provider: ${booking.currentProvider}` : ''}\n\n${booking.notes || ''}`,
            bookingId: bookingId,
            scheduledDate: booking.date,
            scheduledTime: booking.time,
            timezone: booking.timezone || 'America/Belize',
            createdAt: timestamp,
            updatedAt: timestamp
          });
          dbSaved = true;
          context.log('Lead created from booking:', leadId);
        }
      } catch (leadError) {
        context.error('Lead creation failed:', leadError);
        // Continue even if lead creation fails
      }

      // Also save to contacts container for notification
      try {
        const contactsContainer = database?.container('contacts');
        if (contactsContainer) {
          await contactsContainer.items.create({
            id: `booking_contact_${bookingId}`,
            type: 'contact-form',
            name: booking.name,
            email: booking.email,
            phone: booking.phone,
            company: booking.company,
            message: bookingDetails,
            subject: `New Booking: ${booking.name} - ${booking.date} ${booking.time}`,
            timestamp: timestamp,
            source: 'booking-form',
            bookingId: bookingId,
            leadId: leadId
          });
          context.log('Booking notification sent to contacts');
        }
      } catch (contactError) {
        context.error('Contact notification failed:', contactError);
      }

      // Return success response
      return {
        status: 200,
        headers: corsHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          success: true,
          bookingId: bookingId,
          saved: dbSaved,
          message: `Booking confirmed! We will send you a calendar invite at ${booking.email} and contact you to confirm your ${booking.service} consultation.`,
          scheduledFor: `${booking.date} at ${booking.time} ${booking.timezone || 'America/Belize'}`
        })
      };

    } catch (error) {
      context.error('Booking submission error:', error);
      return {
        status: 500,
        headers: corsHeaders({ 'Content-Type': 'application/json' }),
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
      headers: corsHeaders({
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      })
    };
  }
});
