import axios from 'axios';
import { config } from '../config/env.js';
import logger from '../utils/logger.js';

export class SimilarWebService {
  constructor() {
    this.apiEndpoint = 'https://api.similarweb.com/v1/similar-rank';
    this.apiKey = config.SIMILARWEB_API_KEY;
  }

  async getRank(url) {
    try {
      const domain = new URL(url).hostname;
      const response = await axios.get(`${this.apiEndpoint}/${domain}`, {
        headers: {
          'api-key': this.apiKey
        }
      });

      return {
        rank: response.data.similar_rank,
        lastUpdated: response.data.last_updated
      };
    } catch (error) {
      logger.error('SimilarWeb API error:', { url, error: error.message });
      throw new Error(`Failed to fetch rank data: ${error.message}`);
    }
  }
}

export default new SimilarWebService();
