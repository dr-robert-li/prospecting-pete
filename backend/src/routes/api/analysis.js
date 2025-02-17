import express from 'express';
import { analyzeSite } from '../../graphql/resolvers/siteAnalysis.js';
import { batchAnalyzeSites } from '../../graphql/resolvers/batch.js';
import logger from '../../utils/logger.js';

const router = express.Router();

router.post('/single', async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const result = await analyzeSite(null, { url });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/batch', async (req, res, next) => {
  try {
    const { urls } = req.body;
    if (!urls || !Array.isArray(urls)) {
      return res.status(400).json({ error: 'URLs array is required' });
    }

    const results = await batchAnalyzeSites(null, { urls });
    res.json(results);
  } catch (error) {
    next(error);
  }
});

export default router;
