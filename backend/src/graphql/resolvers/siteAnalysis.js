import cruxService from '../../services/cruxService.js';
import psiService from '../../services/psiService.js';
import technicalAnalyzer from '../../services/technicalAnalyzer.js';
import trafficEstimator from '../../services/trafficEstimator.js';
import diffbotService from '../../services/diffbotService.js';
import similarWebService from '../../services/similarWebService.js';
import logger from '../../utils/logger.js';

export const analyzeSite = async (_, { url }) => {
  logger.info(`Starting analysis for URL: ${url}`);
  
  const [
    cruxData,
    pageSpeed,
    technical,
    similarWeb,
    trafficData,
    firmographics
  ] = await Promise.all([
    cruxService.fetchCruxData(url),
    psiService.analyze(url),
    technicalAnalyzer.analyze(url),
    similarWebService.getRank(url),
    trafficEstimator.analyze(url),
    diffbotService.getFirmographics(url)
  ]);

  return {
    url,
    normalizedUrl: cruxData.normalizedUrl,
    cruxData: cruxData.metrics,
    pageSpeed,
    technical,
    traffic: {
      ...trafficData,
      similarWebRank: similarWeb.rank,
      lastUpdated: similarWeb.lastUpdated
    },
    firmographics
  };
};

export default {
  Query: {
    analyzeSite
  }
};
