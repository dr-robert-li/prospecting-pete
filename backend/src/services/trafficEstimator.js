import fs from 'fs';
import { parse } from 'csv-parse/sync';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOP_1M_PATH = path.join(__dirname, '../../includes/top1m.csv');

export class TrafficEstimator {
  constructor() {
    this.domainRanks = new Map();
    this.loadRankings();
    
    this.trafficRanges = [
      { max: 100, range: ["50M", "∞"] },
      { max: 1000, range: ["20M", "50M"] },
      { max: 5000, range: ["10M", "20M"] },
      { max: 10000, range: ["5M", "10M"] },
      { max: 20000, range: ["2M", "5M"] },
      { max: 50000, range: ["1M", "2M"] },
      { max: 100000, range: ["500K", "1M"] },
      { max: 250000, range: ["200K", "500K"] },
      { max: 500000, range: ["100K", "200K"] },
      { max: 1000000, range: ["50K", "100K"] }
    ];
    
  }

  loadRankings() {
    try {
      const fileContent = fs.readFileSync(TOP_1M_PATH, 'utf-8');
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true
      });

      records.forEach(record => {
        this.domainRanks.set(record.domain, parseInt(record.rank));
      });

      logger.info(`Loaded ${this.domainRanks.size} domain rankings`);
    } catch (error) {
      logger.error('Failed to load domain rankings:', error);
      throw new Error('Domain rankings initialization failed');
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

  getRank(url) {
    const domain = this.getDomainFromUrl(url);
    return this.domainRanks.get(domain);
  }

  getTrafficRange(rank) {
    if (!rank) return { lowEstimate: "0", highEstimate: "1K" };

    const range = this.trafficRanges.find(r => rank <= r.max) || 
                 { range: ["0", "1K"] };

    return {
      lowEstimate: range.range[0],
      highEstimate: range.range[1]
    };
  }

  estimateMonthlyVisits(rank) {
    if (!rank) return 0;
    
    // Logarithmic model for traffic estimation
    const baseTraffic = 1000000000; // 1B visits for rank 1
    const logBase = 1.0005;
    
    return Math.floor(baseTraffic * Math.pow(logBase, -rank));
  }

  analyze(url) {
    const domain = this.getDomainFromUrl(url);
    const rank = this.getRank(domain);
    const trafficRange = this.getTrafficRange(rank);
    const monthlyVisits = this.estimateMonthlyVisits(rank);

    return {
      rank,
      traffic: {
        range: trafficRange,
        estimatedMonthlyVisits: monthlyVisits
      },
      confidence: rank ? this.calculateConfidence(rank) : 0
    };
  }

  calculateConfidence(rank) {
    if (rank <= 1000) return 0.9;
    if (rank <= 10000) return 0.8;
    if (rank <= 100000) return 0.7;
    if (rank <= 500000) return 0.6;
    return 0.5;
  }
}

export default new TrafficEstimator();
