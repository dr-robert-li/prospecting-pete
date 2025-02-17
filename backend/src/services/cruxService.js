import axios from 'axios';
import { config } from '../config/env.js';
import logger from '../utils/logger.js';

const PERFORMANCE_THRESHOLDS = {
  largest_contentful_paint: { good: 2500, needs_improvement: 4000 },
  first_contentful_paint: { good: 1800, needs_improvement: 3000 },
  interaction_to_next_paint: { good: 200, needs_improvement: 500 },
  experimental_time_to_first_byte: { good: 800, needs_improvement: 1800 },
  cumulative_layout_shift: { good: 0.1, needs_improvement: 0.25 }
};

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
          metrics: [
            "largest_contentful_paint",
            "first_contentful_paint",
            "interaction_to_next_paint",
            "experimental_time_to_first_byte",
            "cumulative_layout_shift"
          ]
        },
        {
          params: { key: this.apiKey }
        }
      );

      return this.processMetrics(response.data);
    } catch (error) {
      logger.error('CrUX API error:', { url, error: error.message });
      throw new Error(`Failed to fetch CrUX data: ${error.message}`);
    }
  }

  processMetrics(data) {
    const metrics = data.record.metrics;
    const results = {
      url: data.urlNormalizationDetails.originalUrl,
      normalizedUrl: data.urlNormalizationDetails.normalizedUrl,
      metrics: {}
    };

    for (const [metricName, metricData] of Object.entries(metrics)) {
      if (metricData.percentiles && metricData.histogram) {
        const p75 = metricData.percentiles.p75;
        
        results.metrics[metricName] = {
          p75,
          rating: this.calculateRating(metricName, p75),
          distribution: {
            good: metricData.histogram[0].density * 100,
            needsImprovement: metricData.histogram[1].density * 100,
            poor: metricData.histogram[2].density * 100
          },
          histogram: metricData.histogram
        };
      }
    }

    return results;
  }

  calculateRating(metric, value) {
    const thresholds = PERFORMANCE_THRESHOLDS[metric];
    if (!thresholds) return 'N/A';
    
    if (value <= thresholds.good) return 'Good';
    if (value <= thresholds.needs_improvement) return 'Needs Improvement';
    return 'Poor';
  }
}

export default new CruxService();