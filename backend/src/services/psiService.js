import axios from 'axios';
import { config } from '../config/env.js';
import logger from '../utils/logger.js';

export class PageSpeedService {
  constructor() {
    this.apiEndpoint = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
    this.apiKey = config.PSI_API_KEY;
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  async analyze(url) {
    let attempt = 0;
    
    while (attempt < this.maxRetries) {
      try {
        const response = await axios.get(this.apiEndpoint, {
          params: {
            url,
            key: this.apiKey,
            strategy: 'desktop',
            category: ['performance']
          },
          timeout: 30000
        });

        return this.processResults(response.data);
      } catch (error) {
        attempt++;
        
        if (attempt === this.maxRetries) {
          logger.error('PSI API error:', { 
            url, 
            error: error.message,
            statusCode: error.response?.status,
            attempt 
          });
          
          // Return default structure with null values
          return {
            score: null,
            metrics: {
              firstContentfulPaint: null,
              speedIndex: null,
              largestContentfulPaint: null,
              timeToInteractive: null
            }
          };
        }
        
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
  }

  processResults(data) {
    const { lighthouseResult } = data;
    
    return {
      score: Math.round(lighthouseResult.categories.performance.score * 100),
      metrics: {
        firstContentfulPaint: lighthouseResult.audits['first-contentful-paint'].numericValue,
        speedIndex: lighthouseResult.audits['speed-index'].numericValue,
        largestContentfulPaint: lighthouseResult.audits['largest-contentful-paint'].numericValue,
        timeToInteractive: lighthouseResult.audits['interactive'].numericValue
      }
    };
  }
}

export default new PageSpeedService();