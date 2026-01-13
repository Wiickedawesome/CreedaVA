/**
 * Structured logging utility for Azure Functions
 * Provides consistent logging format with correlation IDs
 */

const crypto = require('crypto');

/**
 * Generate a unique correlation ID
 */
function generateCorrelationId() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Log structured messages with context
 * @param {object} context - Azure Functions context object
 * @param {string} level - Log level (info, warn, error, debug)
 * @param {string} message - Log message
 * @param {object} metadata - Additional metadata to log
 */
function logWithContext(context, level, message, metadata = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    message,
    correlationId: metadata.correlationId || context.invocationId || generateCorrelationId(),
    functionName: context.functionName || 'unknown',
    ...metadata
  };

  // Use appropriate logging method based on level
  switch (level.toLowerCase()) {
    case 'error':
      context.error(JSON.stringify(logEntry));
      break;
    case 'warn':
      context.warn(JSON.stringify(logEntry));
      break;
    case 'debug':
      if (process.env.LOG_LEVEL === 'debug') {
        context.log(JSON.stringify(logEntry));
      }
      break;
    default:
      context.log(JSON.stringify(logEntry));
  }
}

/**
 * Log API request details
 */
function logRequest(context, request, metadata = {}) {
  logWithContext(context, 'info', 'API Request', {
    method: request.method,
    url: request.url,
    query: request.query,
    headers: {
      'user-agent': request.headers.get('user-agent'),
      'content-type': request.headers.get('content-type')
    },
    ...metadata
  });
}

/**
 * Log API response details
 */
function logResponse(context, status, duration, metadata = {}) {
  logWithContext(context, 'info', 'API Response', {
    status,
    durationMs: duration,
    ...metadata
  });
}

/**
 * Log slow operations
 */
function logSlowOperation(context, operation, duration, threshold = 500, metadata = {}) {
  if (duration > threshold) {
    logWithContext(context, 'warn', `Slow operation: ${operation}`, {
      operation,
      durationMs: duration,
      threshold,
      ...metadata
    });
  }
}

/**
 * Log Cosmos DB diagnostics
 */
function logCosmosDBDiagnostics(context, operation, duration, headers = {}) {
  const charge = headers['x-ms-request-charge'] || 
                 headers['x-ms-request-charge'.toLowerCase()] || 
                 headers['X-MS-REQUEST-CHARGE'];
  const activityId = headers['x-ms-activity-id'] || 
                     headers['x-ms-activity-id'.toLowerCase()] || 
                     headers['X-MS-ACTIVITY-ID'];
  
  if (duration > 500 || charge || activityId) {
    logWithContext(context, 'info', `Cosmos DB operation: ${operation}`, {
      operation,
      durationMs: duration,
      requestCharge: charge ? parseFloat(charge) : null,
      activityId
    });
  }
}

/**
 * Log security events
 */
function logSecurityEvent(context, event, metadata = {}) {
  logWithContext(context, 'warn', `Security event: ${event}`, {
    event,
    timestamp: new Date().toISOString(),
    ...metadata
  });
}

module.exports = {
  generateCorrelationId,
  logWithContext,
  logRequest,
  logResponse,
  logSlowOperation,
  logCosmosDBDiagnostics,
  logSecurityEvent
};
