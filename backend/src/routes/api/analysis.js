import express from 'express';
import cruxService from '../../services/cruxService.js';
import psiService from '../../services/psiService.js';
import technicalAnalyzer from '../../services/technicalAnalyzer.js';
import trafficEstimator from '../../services/trafficEstimator.js';
import diffbotService from '../../services/diffbotService.js';
import similarWebService from '../../services/similarWebService.js';
import { analyzeSite } from '../../graphql/resolvers/siteAnalysis.js';
import { batchAnalyzeSites } from '../../graphql/resolvers/batch.js';
import logger from '../../utils/logger.js';

const router = express.Router();

// Full Analysis Endpoints
router.post('/single', async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) {
      logger.warn('Single analysis request missing URL');
      return res.status(400).json({ error: 'URL is required' });
    }
    logger.info('Starting single site analysis', { url });
    const result = await analyzeSite(null, { url });
    logger.info('Completed single site analysis', { url });
    res.json(result);
  } catch (error) {
    logger.error('Single analysis failed', { error: error.message });
    next(error);
  }
});

router.post('/batch', async (req, res, next) => {
  try {
    const { urls } = req.body;
    if (!urls || !Array.isArray(urls)) {
      logger.warn('Batch analysis request missing URLs array');
      return res.status(400).json({ error: 'URLs array is required' });
    }
    logger.info('Starting batch analysis', { urlCount: urls.length });
    const results = await batchAnalyzeSites(null, { urls });
    logger.info('Completed batch analysis', { urlCount: urls.length });
    res.json(results);
  } catch (error) {
    logger.error('Batch analysis failed', { error: error.message });
    next(error);
  }
});

// Individual Service Endpoints
router.post('/crux', async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) {
      logger.warn('CrUX analysis request missing URL');
      return res.status(400).json({ error: 'URL is required' });
    }
    logger.info('Starting CrUX analysis', { url });
    const cruxData = await cruxService.fetchCruxData(url);
    logger.info('Completed CrUX analysis', { url });
    res.json(cruxData);
  } catch (error) {
    logger.error('CrUX analysis failed', { error: error.message });
    next(error);
  }
});

router.post('/psi', async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) {
      logger.warn('PageSpeed analysis request missing URL');
      return res.status(400).json({ error: 'URL is required' });
    }
    logger.info('Starting PageSpeed analysis', { url });
    const psiData = await psiService.analyze(url);
    logger.info('Completed PageSpeed analysis', { url });
    res.json(psiData);
  } catch (error) {
    logger.error('PageSpeed analysis failed', { error: error.message });
    next(error);
  }
});

router.post('/technical', async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) {
      logger.warn('Technical analysis request missing URL');
      return res.status(400).json({ error: 'URL is required' });
    }
    logger.info('Starting technical analysis', { url });
    const technicalData = await technicalAnalyzer.analyze(url);
    logger.info('Completed technical analysis', { url });
    res.json(technicalData);
  } catch (error) {
    logger.error('Technical analysis failed', { error: error.message });
    next(error);
  }
});

router.post('/traffic', async (req, res, next) => {
  try {
    const { rank } = req.body;
    if (!rank) {
      logger.warn('Traffic estimate request missing rank');
      return res.status(400).json({ error: 'Rank is required' });
    }
    logger.info('Starting traffic estimation', { rank });
    const trafficRange = trafficEstimator.getTrafficRange(rank);
    const alexaEstimate = trafficEstimator.estimateFromAlexaRank(rank);
    logger.info('Completed traffic estimation', { rank });
    res.json({ trafficRange, alexaEstimate });
  } catch (error) {
    logger.error('Traffic estimation failed', { error: error.message });
    next(error);
  }
});

router.post('/company', async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) {
      logger.warn('Firmographics request missing URL');
      return res.status(400).json({ error: 'URL is required' });
    }
    logger.info('Starting firmographics analysis', { url });
    const firmographics = await diffbotService.getFirmographics(url);
    logger.info('Completed firmographics analysis', { url });
    res.json(firmographics);
  } catch (error) {
    logger.error('Firmographics analysis failed', { error: error.message });
    next(error);
  }
});

router.post('/similarweb', async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) {
      logger.warn('SimilarWeb analysis request missing URL');
      return res.status(400).json({ error: 'URL is required' });
    }
    logger.info('Starting SimilarWeb analysis', { url });
    const rankData = await similarWebService.getRank(url);
    logger.info('Completed SimilarWeb analysis', { url });
    res.json(rankData);
  } catch (error) {
    logger.error('SimilarWeb analysis failed', { error: error.message });
    next(error);
  }
});

export default router;
