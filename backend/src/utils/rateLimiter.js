import { RateLimiterMemory } from 'rate-limiter-flexible';
import { config } from '../config/env.js';
import logger from './logger.js';

const rateLimiter = new RateLimiterMemory({
  points: config.RATE_LIMIT.maxRequests,
  duration: config.RATE_LIMIT.windowMs / 1000
});

export const rateLimiterMiddleware = async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (error) {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: error.msBeforeNext / 1000
    });
  }
};
