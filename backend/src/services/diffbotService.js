import axios from 'axios';
import { config } from '../config/env.js';
import logger from '../utils/logger.js';

export class DiffbotService {
  constructor() {
    this.apiEndpoint = 'https://kg.diffbot.com/kg/v3/dql';
    this.token = config.DIFFBOT_TOKEN;
  }

  async getFirmographics(url) {
    try {
      const response = await axios.get(this.apiEndpoint, {
        params: {
          type: 'queryTextFallback',
          query: `type:Organization homepageUri:"${url}"`,
          col: 'all',
          from: '0',
          size: '1',
          format: 'json',
          jsonmode: ' ',
          nonCanonicalFacts: 'false',
          noDedupArticles: 'false',
          cluster: ' ',
          report: 'false',
          token: this.token
        },
        headers: {
          accept: 'application/json'
        }
      });

      return this.processEntityData(response.data.data[0]?.entity);
    } catch (error) {
      logger.error('Diffbot API error:', { url, error: error.message });
      throw new Error(`Failed to fetch firmographics: ${error.message}`);
    }
  }

  processEntityData(entity) {
    if (!entity) return null;

    return {
      basicInfo: {
        name: entity.name,
        description: entity.description,
        foundingDate: entity.foundingDate,
        isAcquired: entity.isAcquired,
        isDissolved: entity.isDissolved,
        isNonProfit: entity.isNonProfit,
        homepageUri: entity.homepageUri,
        wikipediaUri: entity.wikipediaUri
      },
      financials: {
        revenue: entity.revenue,
        totalInvestment: entity.totalInvestment,
        investments: entity.investments?.map(inv => ({
          date: inv.date,
          amount: inv.amount,
          series: inv.series,
          investors: inv.investors
        }))
      },
      classification: {
        naics: entity.naicsClassification,
        sic: entity.sicClassification,
        categories: entity.diffbotClassification,
        descriptors: entity.descriptors
      },
      contact: {
        emailAddresses: entity.emailAddresses,
        phoneNumbers: entity.phoneNumbers
      },
      social: {
        twitter: entity.twitterUri,
        linkedin: entity.linkedInUri,
        facebook: entity.facebookUri,
        github: entity.githubUri,
        blog: entity.blogUri
      },
      people: {
        employeesMin: entity.nbEmployeesMin,
        employeesMax: entity.nbEmployeesMax,
        founders: entity.founders,
        ceo: entity.ceo
      },
      relationships: {
        competitors: entity.competitors,
        customers: entity.customers,
        partnerships: entity.partnerships,
        suppliers: entity.suppliers
      },
      metrics: {
        monthlyTraffic: entity.monthlyTraffic,
        importance: entity.importance,
        wikipediaPageviews: {
          lastYear: entity.wikipediaPageviewsLastYear,
          growth: entity.wikipediaPageviewsLastYearGrowth
        }
      }
    };
  }
}

export default new DiffbotService();
