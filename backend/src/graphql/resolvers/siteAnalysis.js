import cruxService from '../../services/cruxService.js';
import psiService from '../../services/psiService.js';
import technicalAnalyzer from '../../services/technicalAnalyzer.js';
import trafficEstimator from '../../services/trafficEstimator.js';
import diffbotService from '../../services/diffbotService.js';
import similarWebService from '../../services/similarWebService.js';
import logger from '../../utils/logger.js';

export default {
  Query: {
    analyzeSite: async (_, { url }) => {
      logger.info(`Starting analysis for URL: ${url}`);
      
      const [
        cruxData,
        pageSpeed,
        technical,
        similarWeb,
        firmographics
      ] = await Promise.all([
        cruxService.fetchCruxData(url),
        psiService.analyze(url),
        technicalAnalyzer.analyze(url),
        similarWebService.getRank(url),
        diffbotService.getFirmographics(url)
      ]);

      const trafficRange = trafficEstimator.getTrafficRange(similarWeb.rank);
      const alexaEstimate = trafficEstimator.estimateFromAlexaRank(similarWeb.rank);

      return {
        url,
        cruxData,
        pageSpeed,
        technical,
        traffic: {
          similarWebRank: similarWeb.rank,
          estimatedRange: trafficRange,
          alexaEstimate,
          lastUpdated: similarWeb.lastUpdated
        },
        firmographics
      };
    }
  }
};
