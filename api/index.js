// Azure Functions v4 Entry Point
// This file exports all function handlers for the v4 programming model

// Export individual functions
module.exports = {
  ...require('./getAnalytics'),
  ...require('./trackEvent'), 
  ...require('./submitContact'),
  ...require('./submitBooking'),
  ...require('./adminApi'),
  ...require('./health'),
  ...require('./getPublicBlog'),
  ...require('./getPublicSeo'),
  ...require('./getSitemap'),
  ...require('./diagnose')
};

console.log('✅ Azure Functions loaded successfully');
