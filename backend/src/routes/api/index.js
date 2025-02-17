import express from 'express';
import analysisRoutes from './analysis.js';
import { rateLimiterMiddleware } from '../../utils/rateLimiter.js';
import { errorHandler } from '../../utils/errorHandler.js';

const router = express.Router();

router.use(rateLimiterMiddleware);
router.use('/analysis', analysisRoutes);
router.use(errorHandler);

export default router;
