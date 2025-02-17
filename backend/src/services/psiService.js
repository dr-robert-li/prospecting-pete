import axios from 'axios';
import { config } from '../config/env.js';
import logger from '../utils/logger.js';

export class PageSpeedService {
  constructor() {
    this.apiEndpoint = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
    this.apiKey = config.PSI_API_KEY;
  }

  async analyze(url) {
    try {
      const response = await axios.get(this.apiEndpoint, {
        params: {
          url,
          key: this.apiKey,
          strategy: 'desktop'
        }
      });

      const { lighthouseResult } = response.data;
      
      return {
        score: Math.round(lighthouseResult.categories.performance.score * 100),
        metrics: {
          firstContentfulPaint: lighthouseResult.audits['first-contentful-paint'].numericValue,
          speedIndex: lighthouseResult.audits['speed-index'].numericValue,
          largestContentfulPaint: lighthouseResult.audits['largest-contentful-paint'].numericValue,
          timeToInteractive: lighthouseResult.audits['interactive'].numericValue
        }
      };
    } catch (error) {
      logger.error('PSI API error:', { url, error: error.message });
      throw new Error(`Failed to fetch PageSpeed data: ${error.message}`);
    }
  }
}

export default new PageSpeedService();
