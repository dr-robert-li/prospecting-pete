import axios from 'axios';
import { JSDOM } from 'jsdom';
import dns from 'dns/promises';
import logger from '../utils/logger.js';

export class TechnicalAnalyzer {
  constructor() {
    this.commonPlugins = [
      'woocommerce',
      'elementor',
      'contact-form-7',
      'yoast-seo',
      'wordfence',
      'wp-rocket'
    ];
  }

  async analyze(url) {
    try {
      // Fetch main page and DNS info
      const response = await axios.get(url);
      const hostname = new URL(url).hostname;
      const ipAddresses = await dns.resolve4(hostname);
      const dom = new JSDOM(response.data);
      
      // Get IP details
      const ipInfo = await this.getIpInfo(ipAddresses[0]);
      
      // Analyze WordPress installation
      const wpData = this.extractWordPressData(dom.window.document, response.data);
      
      // Check additional endpoints
      const wpEndpoints = await this.checkWordPressEndpoints(url);
      
      return {
        wordpress: {
          ...wpData,
          endpoints: wpEndpoints
        },
        infrastructure: {
          headers: this.analyzeHeaders(response.headers),
          server: {
            ipAddress: ipAddresses[0],
            host: hostname,
            location: ipInfo?.location,
            provider: ipInfo?.org,
            asn: ipInfo?.asn,
            hosting: ipInfo?.hosting
          }
        }
      };
    } catch (error) {
      logger.error('Technical analysis error:', { url, error: error.message });
      throw new Error(`Failed to analyze technical data: ${error.message}`);
    }
  }

  async getIpInfo(ip) {
    try {
      const response = await axios.get(`https://ipinfo.io/${ip}/json`);
      const { city, region, country, loc, org, asn, company } = response.data;
      
      return {
        location: {
          city,
          region,
          country,
          coordinates: loc
        },
        org,
        asn,
        hosting: company
      };
    } catch (error) {
      logger.error('IP Info lookup failed:', { ip, error: error.message });
      return null;
    }
  }

  analyzeHeaders(headers) {
    const securityHeaders = {
      hsts: headers['strict-transport-security'],
      xssProtection: headers['x-xss-protection'],
      contentSecurityPolicy: headers['content-security-policy'],
      frameOptions: headers['x-frame-options'],
      contentType: headers['x-content-type-options']
    };

    return {
      server: headers.server,
      poweredBy: headers['x-powered-by'],
      caching: {
        control: headers['cache-control'],
        expires: headers.expires,
        etag: headers.etag
      },
      security: securityHeaders,
      compression: headers['content-encoding'],
      cdn: this.detectCDN(headers)
    };
  }

  detectCDN(headers) {
    const cdnSignatures = {
      'cloudflare': ['cf-ray', 'cf-cache-status'],
      'akamai': ['x-akamai-transformed', 'akamai-origin-hop'],
      'fastly': ['x-served-by', 'x-cache'],
      'cloudfront': ['x-amz-cf-id', 'x-cache'],
      'maxcdn': ['x-cdn', 'x-edge-location'],
      'keycdn': ['x-edge-location']
    };

    return Object.entries(cdnSignatures)
      .filter(([cdn, headerKeys]) => 
        headerKeys.some(key => headers[key])
      )
      .map(([cdn]) => cdn);
  }

  extractWordPressData(document, rawHtml) {
    return {
      core: this.getWordPressVersion(document, rawHtml),
      theme: this.getThemeInfo(document, rawHtml),
      plugins: this.getPlugins(document, rawHtml),
      customization: this.getCustomization(document, rawHtml)
    };
  }

  getWordPressVersion(document, rawHtml) {
    const metaVersion = document.querySelector('meta[name="generator"]')?.content;
    const rssLink = document.querySelector('link[rel="alternate"][type="application/rss+xml"]');
    const adminLinks = document.querySelectorAll('link[href*="wp-admin"]');

    return {
      detected: metaVersion?.includes('WordPress') || adminLinks.length > 0,
      version: metaVersion?.replace('WordPress ', '') || 'Unknown',
      features: {
        rss: !!rssLink,
        adminAccess: adminLinks.length > 0
      }
    };
  }

  getThemeInfo(document, rawHtml) {
    const themeStyles = Array.from(document.querySelectorAll('link[href*="wp-content/themes/"]'));
    const themeNames = themeStyles.map(style => {
      const match = style.href.match(/themes\/([^\/]+)/);
      return match ? match[1] : null;
    }).filter(Boolean);

    return {
      name: themeNames[0] || null,
      childTheme: themeNames.length > 1,
      customCss: !!document.querySelector('style#custom-css, link[href*="wp-content/uploads/"]')
    };
  }

  getPlugins(document, rawHtml) {
    const pluginUrls = new Set([
      ...Array.from(document.querySelectorAll('script[src*="wp-content/plugins/"]')),
      ...Array.from(document.querySelectorAll('link[href*="wp-content/plugins/"]'))
    ].map(el => {
      const match = (el.src || el.href).match(/plugins\/([^\/]+)/);
      return match ? match[1] : null;
    }).filter(Boolean));

    const detectedPlugins = Array.from(pluginUrls);
    const commonPluginsFound = this.commonPlugins.filter(plugin => 
      detectedPlugins.includes(plugin) || rawHtml.includes(`wp-content/plugins/${plugin}`)
    );

    return {
      total: detectedPlugins.length,
      detected: detectedPlugins,
      common: commonPluginsFound
    };
  }

  getCustomization(document, rawHtml) {
    const customPostTypes = new Set();
    const shortcodes = new Set();
    
    // Extract custom post types
    const postTypeMatches = rawHtml.match(/post_type=([^&"]+)/g) || [];
    postTypeMatches.forEach(match => {
      const type = match.replace('post_type=', '');
      if (!['post', 'page'].includes(type)) {
        customPostTypes.add(type);
      }
    });

    // Extract shortcodes
    const shortcodeMatches = rawHtml.match(/\[([^\s\]]+)/g) || [];
    shortcodeMatches.forEach(match => {
      shortcodes.add(match.replace('[', ''));
    });

    return {
      customPostTypes: Array.from(customPostTypes),
      shortcodes: Array.from(shortcodes),
      widgetAreas: this.detectWidgetAreas(document),
      customizer: !!document.querySelector('#customize-preview')
    };
  }

  detectWidgetAreas(document) {
    return Array.from(document.querySelectorAll('[class*="widget-area"], [id*="sidebar"]'))
      .map(element => ({
        id: element.id,
        class: element.className
      }));
  }

  async checkWordPressEndpoints(baseUrl) {
    const endpoints = [
      '/wp-json',
      '/wp-admin',
      '/wp-login.php',
      '/xmlrpc.php'
    ];

    const results = await Promise.all(
      endpoints.map(async endpoint => {
        try {
          const response = await axios.head(`${baseUrl}${endpoint}`);
          return {
            path: endpoint,
            accessible: response.status < 400,
            status: response.status
          };
        } catch (error) {
          return {
            path: endpoint,
            accessible: false,
            status: error.response?.status || 0
          };
        }
      })
    );

    return results.reduce((acc, curr) => {
      acc[curr.path.replace('/', '')] = curr;
      return acc;
    }, {});
  }
}

export default new TechnicalAnalyzer();
