
'use strict';

const rateLimit = require('express-rate-limit');

// Strict rate limiter for authentication routes.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                  // 5 attempts per IP
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,

  // Return 429 and tell the client when it can retry.
  handler: (req, res, next, options) => {
    const resetTime = req.rateLimit?.resetTime;

    const retryAfterSeconds = resetTime
      ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
      : Math.ceil(options.windowMs / 1000);

    res.setHeader('Retry-After', String(retryAfterSeconds));

    res.status(429).json({
      error: 'Too many requests, please try again later.'
    });
  }
});

/*
 * Redis scaling:
 * In a multi-instance deployment, the default MemoryStore keeps
 * separate counters inside each Node.js process. Behind a load
 * balancer, requests can reach different instances and bypass
 * the intended shared limit.
 *
 * Using rate-limit-redis with RedisStore and a shared Redis
 * connection allows all instances to use the same rate-limit
 * counters, enforcing one consistent limit across the cluster.
 */

module.exports = authLimiter;
