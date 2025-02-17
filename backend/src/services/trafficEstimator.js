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
    
    // Traffic estimation ranges based on rank positions
    this.trafficRanges = [
      { max: 100, range: ["10M", "100M"] },
      { max: 1000, range: ["5M", "10M"] },
      { max: 5000, range: ["1M", "5M"] },
      { max: 10000, range: ["500K", "1M"] },
      { max: 50000, range: ["100K", "500K"] },
      { max: 100000, range: ["50K", "100K"] },
      { max: 250000, range: ["10K", "50K"] },
      { max: 500000, range: ["5K", "10K"] },
      { max: 1000000, range: ["1K", "5K"] }
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

  getRank(domain) {
    // Handle www. and subdomain variations
    const variations = [
      domain,
      domain.replace('www.', ''),
      `www.${domain.replace('www.', '')}`
    ];

    for (const variation of variations) {
      const rank = this.domainRanks.get(variation);
      if (rank) return rank;
    }

    return null;
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
    
    // Using a logarithmic model for traffic estimation
    // Based on empirical data correlations
    const baseTraffic = 1000000000; // 1B visits for rank 1
    const logBase = 1.0005;
    
    return Math.floor(baseTraffic * Math.pow(logBase, -rank));
  }

  analyze(domain) {
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
    // Higher confidence for higher-ranked sites
    if (rank <= 1000) return 0.9;
    if (rank <= 10000) return 0.8;
    if (rank <= 100000) return 0.7;
    if (rank <= 500000) return 0.6;
    return 0.5;
  }
}

export default new TrafficEstimator();
