import fs from 'fs';
import { parse } from 'csv-parse/sync';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';
import similarWebService from './similarWebService.js';

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
      { max: 1000000, range: ["50K", "100K"] },
      { max: 2500000, range: ["20K", "50K"] },
      { max: 5000000, range: ["10K", "20K"] },
      { max: 10000000, range: ["1K", "10K"] }
    ];
  }

  loadRankings() {
    try {
      const fileContent = fs.readFileSync(TOP_1M_PATH, 'utf-8');
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true
      });
  
      // Process records to keep lowest rank for duplicates
      records.forEach(record => {
        const domain = record.domain;
        const newRank = parseInt(record.rank);
        const existingRank = this.domainRanks.get(domain);
        
        // Only update if no existing rank or new rank is lower
        if (!existingRank || newRank < existingRank) {
          this.domainRanks.set(domain, newRank);
        }
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
      domain = url.replace(/^(https?:\/\/)?(www\.)?/, '');
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
    if (!rank || rank <= 0) return 0;

    // Parameters
    const baseTraffic = 139290000000; // Google's monthly visits
    const decayExponent = -1.05;

    // Damping factor based on rank tiers
    let dampingFactor;
    if (rank <= 10000) {
        dampingFactor = 1.0;
    } else if (rank <= 100000) {
        dampingFactor = 0.8;
    } else if (rank <= 1000000) {
        dampingFactor = 0.5;
    } else {
        dampingFactor = 0.3;
    }

    // Calculate estimated visits
    const estimatedVisits = dampingFactor * baseTraffic * Math.pow(rank, decayExponent);
    return Math.max(Math.floor(estimatedVisits), 1); // Ensure at least 1 visit
  }

  calculateConfidence(rank) {
    if (rank <= 1000) return 0.9;
    if (rank <= 10000) return 0.8;
    if (rank <= 100000) return 0.7;
    if (rank <= 500000) return 0.6;
    return 0.5;
  }

  async analyze(url) {
    const domain = this.getDomainFromUrl(url);
    let rank = null;
    let dataSource = null;
    
    // Try SimilarWeb first
    //logger.info('Fetching rank from SimilarWeb', { domain });
    const similarWebData = await similarWebService.getRank(url);
    rank = similarWebData.rank;
    
    if (rank) {
      dataSource = 'similarweb';
      //logger.info('Using SimilarWeb rank data', { domain, rank });
    } else {
      // Fallback to top1m.csv
      //logger.info('SimilarWeb rank not found, checking top1m.csv', { domain });
      rank = this.getRank(domain);
      dataSource = rank ? 'top1m' : null;
      //logger.info('Top1m.csv lookup result', { domain, rank, dataSource });
    }
  
    const trafficRange = this.getTrafficRange(rank);
    const monthlyVisits = this.estimateMonthlyVisits(rank);
  
    return {
      domain,
      rank,
      source: dataSource,
      traffic: {
        range: trafficRange,
        estimatedMonthlyVisits: monthlyVisits
      },
      confidence: rank ? this.calculateConfidence(rank) : 0,
      lastUpdated: new Date().toISOString()
    };
  }
  
}

export default new TrafficEstimator();
