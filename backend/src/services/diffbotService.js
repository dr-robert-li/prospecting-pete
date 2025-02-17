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
          size: '1',
          format: 'json',
          token: this.token
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
        name: this.extractString(entity.name),
        description: this.extractString(entity.description),
        foundingDate: this.extractDateString(entity.foundingDate),
        isAcquired: Boolean(entity.isAcquired),
        isDissolved: Boolean(entity.isDissolved),
        isNonProfit: Boolean(entity.isNonProfit),
        homepageUri: this.extractString(entity.homepageUri),
        wikipediaUri: this.extractString(entity.wikipediaUri)
      },
      financials: {
        revenue: this.extractMonetaryValue(entity.revenue),
        totalInvestment: this.extractMonetaryValue(entity.totalInvestment),
        investments: entity.investments?.map(inv => ({
          date: this.extractDateString(inv.date),
          amount: this.extractMonetaryValue(inv.amount),
          series: this.extractString(inv.series),
          investors: inv.investors?.map(investor => this.extractString(investor.name)) || []
        })) || []
      },
      classification: {
        naics: this.extractArrayToString(entity.naicsClassification),
        sic: this.extractArrayToString(entity.sicClassification),
        categories: entity.diffbotClassification?.map(this.extractString) || [],
        descriptors: entity.descriptors?.map(this.extractString) || []
      },
      contact: {
        emailAddresses: entity.emailAddresses?.map(email => 
          this.extractString(email.contactString || email.value)
        ) || [],
        phoneNumbers: entity.phoneNumbers?.map(phone => 
          this.extractString(phone.string || phone.digits)
        ) || []
      },
      social: {
        twitter: this.extractString(entity.twitterUri),
        linkedin: this.extractString(entity.linkedInUri),
        facebook: this.extractString(entity.facebookUri),
        github: this.extractString(entity.githubUri),
        blog: this.extractString(entity.blogUri)
      },
      people: {
        employeesMin: this.extractNumber(entity.nbEmployeesMin),
        employeesMax: this.extractNumber(entity.nbEmployeesMax),
        founders: entity.founders?.map(founder => this.extractString(founder.name)) || [],
        ceo: this.extractString(entity.ceo?.name)
      },
      relationships: {
        competitors: entity.competitors?.map(comp => this.extractString(comp.name)) || [],
        customers: entity.customers?.map(cust => this.extractString(cust.name)) || [],
        partnerships: entity.partnerships?.map(partner => this.extractString(partner.name)) || [],
        suppliers: entity.suppliers?.map(supplier => this.extractString(supplier.name)) || []
      },
      metrics: {
        monthlyTraffic: this.extractNumber(entity.monthlyTraffic),
        importance: this.extractNumber(entity.importance),
        wikipediaPageviews: {
          lastYear: this.extractNumber(entity.wikipediaPageviewsLastYear),
          growth: this.extractNumber(entity.wikipediaPageviewsLastYearGrowth)
        }
      }
    };
  }

  extractString(value) {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      if (value.name) return value.name;
      if (value.value) return value.value;
      if (value.str) return value.str;
      return value.toString();
    }
    return String(value);
  }

  extractDateString(dateObj) {
    if (!dateObj) return null;
    if (typeof dateObj === 'string') return dateObj;
    if (dateObj.str) return dateObj.str;
    if (dateObj.value) return dateObj.value;
    if (dateObj.date) return dateObj.date;
    if (dateObj.year) return `${dateObj.year}-${dateObj.month || '01'}-${dateObj.day || '01'}`;
    return null;
  }

  extractMonetaryValue(moneyObj) {
    if (!moneyObj) return null;
    if (typeof moneyObj === 'string') return moneyObj;
    if (moneyObj.value) return moneyObj.value;
    if (moneyObj.amount) {
      const amount = this.formatCurrency(moneyObj.amount);
      const currency = moneyObj.currency || 'USD';
      return `${amount} ${currency}`;
    }
    return null;
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  }

  extractNumber(value) {
    if (!value) return null;
    const num = Number(value);
    return isNaN(num) ? null : num;
  }

  extractArrayToString(arr) {
    if (!arr) return null;
    if (typeof arr === 'string') return arr;
    if (Array.isArray(arr)) {
      return arr.map(item => this.extractString(item)).filter(Boolean).join(', ');
    }
    return null;
  }
}

export default new DiffbotService();