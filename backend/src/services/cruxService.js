import axios from 'axios';
import { config } from '../config/env.js';
import logger from '../utils/logger.js';

export class CruxService {
  constructor() {
    this.apiEndpoint = 'https://chromeuxreport.googleapis.com/v1/records:queryRecord';
    this.apiKey = config.CRUX_API_KEY;
  }

  async fetchCruxData(url) {
    try {
      const response = await axios.post(
        this.apiEndpoint,
        {
          url,
          formFactor: 'DESKTOP'
        },
        {
          params: { key: this.apiKey }
        }
      );

      const { metrics } = response.data.record;
      
      return {
        fcp: metrics.first_contentful_paint.percentiles.p75,
        lcp: metrics.largest_contentful_paint.percentiles.p75,
        cls: metrics.cumulative_layout_shift.percentiles.p75,
        fid: metrics.first_input_delay?.percentiles.p75
      };
    } catch (error) {
      logger.error('CrUX API error:', { url, error: error.message });
      throw new Error(`Failed to fetch CrUX data: ${error.message}`);
    }
  }
}

export default new CruxService();
