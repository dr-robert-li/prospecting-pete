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
    const urlVariations = this.generateUrlVariations(url);
    
    for (const variation of urlVariations) {
      try {
        const response = await this.makeRequest(variation);
        return this.processMetrics(response.data);
      } catch (error) {
        if (error.response?.status === 404) {
          continue; // Try next variation
        }
        throw error;
      }
    }

    // If all URL variations fail, try origin data
    return this.fetchOriginData(url);
  }

  generateUrlVariations(url) {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    const variations = [];
    
    // Generate all combinations of www/non-www and http/https
    const protocols = ['https:', 'http:'];
    const domains = [
      urlObj.hostname,
      urlObj.hostname.startsWith('www.') ? 
        urlObj.hostname.replace('www.', '') : 
        `www.${urlObj.hostname}`
    ];

    protocols.forEach(protocol => {
      domains.forEach(domain => {
        urlObj.protocol = protocol;
        urlObj.hostname = domain;
        variations.push(urlObj.toString());
      });
    });

    return variations;
  }

  async makeRequest(url) {
    return axios.post(
      `${this.apiEndpoint}?key=${this.apiKey}`,
      {
        url,
        formFactor: 'DESKTOP',
        metrics: [
          'largest_contentful_paint',
          'first_contentful_paint',
          'interaction_to_next_paint',
          'experimental_time_to_first_byte',
          'cumulative_layout_shift'
        ]
      },
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );
  }

  async fetchOriginData(url) {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      const origin = `${urlObj.protocol}//${urlObj.hostname}`;
      
      const response = await axios.post(
        `${this.apiEndpoint}?key=${this.apiKey}`,
        {
          origin,
          formFactor: 'DESKTOP',
          metrics: [
            'largest_contentful_paint',
            'first_contentful_paint',
            'interaction_to_next_paint',
            'experimental_time_to_first_byte',
            'cumulative_layout_shift'
          ]
        },
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      return this.processMetrics(response.data);
    } catch (error) {
      logger.error('CrUX Origin API error:', { url, error: error.message });
      return this.getEmptyMetrics();
    }
  }

  processMetrics(data) {
    if (!data?.record?.metrics) {
      return this.getEmptyMetrics();
    }

    const results = {
      url: data.urlNormalizationDetails?.originalUrl || 'unknown',
      normalizedUrl: data.urlNormalizationDetails?.normalizedUrl || 'unknown',
      collectionPeriod: data.record.collectionPeriod,
      metrics: {}
    };

    const metrics = data.record.metrics;
    for (const [metricName, metricData] of Object.entries(metrics)) {
      if (metricData?.percentiles && metricData?.histogram) {
        const p75 = metricData.percentiles.p75;
        
        results.metrics[metricName] = {
          p75,
          rating: this.calculateRating(metricName, p75),
          distribution: {
            good: metricData.histogram[0].density * 100,
            needsImprovement: metricData.histogram[1].density * 100,
            poor: metricData.histogram[2].density * 100
          },
          histogram: metricData.histogram.map(bin => ({
            start: bin.start,
            end: bin.end,
            density: bin.density * 100
          }))
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

  getEmptyMetrics() {
    return {
      url: 'unknown',
      normalizedUrl: 'unknown',
      collectionPeriod: null,
      metrics: {}
    };
  }
}

export default new CruxService();