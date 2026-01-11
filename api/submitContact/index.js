const { app } = require('@azure/functions');
const { CosmosClient } = require('@azure/cosmos');

const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
const databaseId = process.env.COSMOS_DATABASE || 'creedava';
const containerId = 'contacts';
const { corsHeaders, corsHeadersForOrigin } = require('../shared/cors');

let client, database, container;

if (endpoint && key) {
  client = new CosmosClient({ endpoint, key });
  database = client.database(databaseId);
  container = database.container(containerId);
}

app.http('submitContact', {
  methods: ['POST', 'PUT', 'DELETE', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return {
        status: 200,
        headers: corsHeadersForOrigin(request.headers.origin)
      };
    }

    try {
      if (!endpoint || !key) {
        context.log('Cosmos DB not configured');
        return {
          status: 200,
          headers: corsHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ 
            success: true, 
            message: 'Request received (storage not configured)' 
          })
        };
      }

      const body = await request.json();
      const { table, data, filter } = body;

      // Handle different HTTP methods
      if (request.method === 'POST') {
        // INSERT operation
        const tableName = table || 'contacts';
        const targetContainer = database.container(tableName);
        
        const item = {
          id: `${tableName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: tableName, // Add type field for partition key
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        await targetContainer.items.create(item);
        
        return {
          status: 200,
          headers: corsHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ success: true, data: item })
        };
      } else if (request.method === 'PUT') {
        // UPDATE operation
        const tableName = table || 'contacts';
        const targetContainer = database.container(tableName);
        
        if (!filter || !filter.column || !filter.value) {
          return {
            status: 400,
            headers: corsHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ error: 'Filter required for update' })
          };
        }

        // Fetch existing item first to preserve partition key and merge updates
        const { resource: existingItem } = await targetContainer.item(filter.value, tableName).read();
        
        const updatedData = {
          ...existingItem,
          ...data,
          updated_at: new Date().toISOString()
        };

        await targetContainer.item(filter.value, tableName).replace(updatedData);
        
        return {
          status: 200,
          headers: corsHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ success: true, data: updatedData })
        };
      } else if (request.method === 'DELETE') {
        // DELETE operation
        const tableName = table || 'contacts';
        const targetContainer = database.container(tableName);
        
        if (!filter || !filter.column || !filter.value) {
          return {
            status: 400,
            headers: corsHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ error: 'Filter required for delete' })
          };
        }

        // Use tableName as partition key value (matches the type field)
        await targetContainer.item(filter.value, tableName).delete();
        
        return {
          status: 200,
          headers: corsHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ success: true })
        };
      }

      // Legacy contact form handling (backward compatibility)
      const { name, email, company, phone, message, service } = body;

      // Validate required fields
      if (!name || !email || !message) {
        return {
          status: 400,
          headers: corsHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ 
            success: false, 
            error: 'Name, email, and message are required' 
          })
        }
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
        headers: corsHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ 
          success: true, 
          message: 'Thank you for contacting us! We will get back to you soon.' 
        })
      };
    } catch (error) {
      context.error('Error submitting contact form:', error);
      return {
        status: 500,
        headers: corsHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ 
          success: false, 
          error: 'Failed to submit contact form. Please try again.' 
        })
      };
    }
  }
});
