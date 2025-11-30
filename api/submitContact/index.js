const { app } = require('@azure/functions');
const { CosmosClient } = require('@azure/cosmos');

const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
const databaseId = process.env.COSMOS_DATABASE || 'website-data';
const containerId = process.env.COSMOS_CONTAINER || 'contacts';

let client, database, container;

if (endpoint && key) {
  client = new CosmosClient({ endpoint, key });
  database = client.database(databaseId);
  container = database.container(containerId);
}

app.http('submitContact', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      };
    }

    try {
      if (!endpoint || !key) {
        context.log('Cosmos DB not configured - contact form submitted but not stored');
        return {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            success: true, 
            message: 'Contact form received (storage not configured)' 
          })
        };
      }

      const body = await request.json();
      const { name, email, company, phone, message, service } = body;

      // Validate required fields
      if (!name || !email || !message) {
        return {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            success: false, 
            error: 'Name, email, and message are required' 
          })
        };
      }

      const item = {
        id: `contact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'contact-form',
        name,
        email,
        company: company || null,
        phone: phone || null,
        message,
        service: service || null,
        status: 'new',
        submittedAt: new Date().toISOString(),
        source: 'website'
      };

      await container.items.create(item);

      context.log('Contact form submitted:', email);

      return {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: true, 
          message: 'Thank you for contacting us! We will get back to you soon.' 
        })
      };
    } catch (error) {
      context.error('Error submitting contact form:', error);
      return {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: false, 
          error: 'Failed to submit contact form. Please try again.' 
        })
      };
    }
  }
});
