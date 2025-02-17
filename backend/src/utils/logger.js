import winston from 'winston';
import { config } from '../config/env.js';
import path from 'path';
import fs from 'fs';

// Create logs directory structure if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs', 'expressjs');
fs.mkdirSync(logsDir, { recursive: true });

const logger = winston.createLogger({
  level: config.NODE_ENV === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log') 
    })
  ]
});

export default logger;
