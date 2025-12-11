const { app } = require('@azure/functions');

// This file is required as the entry point for Azure Functions v4
// The actual function implementations are in their respective folders

// Functions will be registered from:
// - getAnalytics/index.js
// - trackEvent/index.js
// - submitContact/index.js

// No additional code needed here - functions auto-register via app.http()
console.log('Azure Functions initialized');
