import axios from 'axios';
import { JSDOM } from 'jsdom';
import dns from 'dns/promises';
import logger from '../utils/logger.js';

export class TechnicalAnalyzer {
  async analyze(url) {
    try {
      const response = await axios.get(url);
      const hostname = new URL(url).hostname;
      const ipAddresses = await dns.resolve4(hostname);
      const dom = new JSDOM(response.data);
      
      return {
        headers: response.headers,
        ipAddress: ipAddresses[0],
        host: hostname,
        sourceFiles: this.extractSourceFiles(dom.window.document),
        serverInfo: {
          server: response.headers.server,
          poweredBy: response.headers['x-powered-by']
        }
      };
    } catch (error) {
      logger.error('Technical analysis error:', { url, error: error.message });
      throw new Error(`Failed to analyze technical data: ${error.message}`);
    }
  }

  extractSourceFiles(document) {
    const scripts = [...document.querySelectorAll('script[src]')].map(el => el.src);
    const styles = [...document.querySelectorAll('link[rel="stylesheet"]')].map(el => el.href);
    const images = [...document.querySelectorAll('img[src]')].map(el => el.src);
    
    return {
      scripts,
      styles,
      images
    };
  }
}

export default new TechnicalAnalyzer();
