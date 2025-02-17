import dotenv from 'dotenv';
dotenv.config();

export const config = {
  PORT: process.env.PORT || 4000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CRUX_API_KEY: process.env.CRUX_API_KEY,
  PSI_API_KEY: process.env.PSI_API_KEY,
  DIFFBOT_TOKEN: process.env.DIFFBOT_TOKEN,
  SIMILARWEB_API_KEY: process.env.SIMILARWEB_API_KEY,
  RATE_LIMIT: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 1000 || 60000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  }
};
