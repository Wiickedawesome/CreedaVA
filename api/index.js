// Azure Functions v4 Entry Point
// This file loads all function handlers

// Load all functions
require('./getAnalytics');
require('./trackEvent');
require('./submitContact');

console.log('✅ Azure Functions loaded successfully');
