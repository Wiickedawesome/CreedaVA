const { app } = require('@azure/functions');

// Azure Functions v4 Entry Point for Static Web Apps
// Import and register all function handlers

// Import all function modules to trigger their app.http() registrations
require('../getAnalytics');
require('../trackEvent');
require('../submitContact');
require('../submitBooking');
require('../adminApi');
require('../health');
require('../getPublicBlog');
require('../diagnose');

console.log('✅ Azure Functions initialized and registered');
