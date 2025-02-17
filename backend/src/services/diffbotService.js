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
      const query = `type:Organization allUris:"${url}"`;
      const response = await axios.get(this.apiEndpoint, {
        params: {
          type: 'query',
          query,
          col: 'all',
          size: 1,
          format: 'json',
          token: this.token
        }
      });

      return this.cleanResponse(response.data.data[0]);
    } catch (error) {
      logger.error('Diffbot API error:', { url, error: error.message });
      throw new Error(`Failed to fetch firmographics: ${error.message}`);
    }
  }

  cleanResponse(data) {
    if (!data) return null;

    return {
      name: data.name,
      description: data.description,
      employeeCount: data.nbEmployees,
      revenue: data.revenue,
      industry: data.industries?.[0]?.name,
      location: data.locations?.[0],
      foundedYear: data.foundedDate?.year,
      socialProfiles: {
        linkedin: data.linkedInProfile,
        twitter: data.twitterProfile
      }
    };
  }
}

export default new DiffbotService();
