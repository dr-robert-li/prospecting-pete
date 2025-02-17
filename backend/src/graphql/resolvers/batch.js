import { analyzeSite } from './siteAnalysis.js';
import logger from '../../utils/logger.js';

export const batchAnalyzeSites = async (_, { urls }) => {
  logger.info(`Starting batch analysis for ${urls.length} URLs`);
  
  const chunkSize = 5;
  const results = [];
  
  for (let i = 0; i < urls.length; i += chunkSize) {
    const chunk = urls.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(
      chunk.map(url => analyzeSite(null, { url }))
    );
    results.push(...chunkResults);
  }

  return results;
};

export default {
  Query: {
    batchAnalyzeSites
  }
};
