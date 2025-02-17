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
      const domain = this.getDomainFromUrl(url);
      const apiUrl = `${this.apiEndpoint}/${domain}/rank`;
      
      const response = await axios.get(apiUrl, {
        params: {
          api_key: this.apiKey
        }
      });

      // Extract rank from correct response structure
      const rank = response.data?.similar_rank?.rank;
      const lastUpdated = response.data?.meta?.last_updated;

      return {
        rank: typeof rank === 'number' ? rank : null,
        lastUpdated: lastUpdated || null
      };
    } catch (error) {
      logger.error('SimilarWeb API error:', { url, error: error.message });
      return { rank: null, lastUpdated: null };
    }
  }

  getDomainFromUrl(url) {
    let domain = url;
    if (typeof url === 'string') {
      // Remove protocol and www if present
      domain = url.replace(/^(https?:\/\/)?(www\.)?/, '');
      // Remove any path or query parameters
      domain = domain.split('/')[0];
    }
    return domain;
  }
}

export default new SimilarWebService();
