# Prospecting Pete Backend

Advanced website analysis backend service providing comprehensive technical, traffic, and company insights through both GraphQL and REST APIs.

## Features

- WordPress detection and analysis
- Performance metrics (CrUX, PageSpeed)
- Traffic estimation and rankings
- Technical infrastructure analysis
- Company firmographics
- Batch analysis capabilities

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/prospecting-pete.git
cd prospecting-pete/backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file with your API keys and configuration settings.

For example:

```
PORT=4000
NODE_ENV=development
CRUX_API_KEY=your_crux_api_key
PSI_API_KEY=your_pagespeed_api_key
SIMILARWEB_API_KEY=your_similarweb_api_key
DIFFBOT_TOKEN=your_diffbot_token
RATE_LIMIT_WINDOW=60
RATE_LIMIT_MAX_REQUESTS=100
```

4. Start the server:

```bash
npm run dev    # Development with hot reload
npm start      # Production
```

## GraphQL API

`POST /graphql`

### Example Single Site Analysis

```graphql
query {
  analyzeSite(url: "example.com") {
    url
    cruxData {
      largest_contentful_paint {
        p75
        rating
        distribution {
          good
          needsImprovement
          poor
        }
      }
      first_contentful_paint {
        p75
        rating
      }
    }
    pageSpeed {
      score
      metrics {
        firstContentfulPaint
        speedIndex
      }
    }
    technical {
      wordpress {
        core {
          detected
          version
        }
        theme {
          name
          childTheme
        }
        plugins {
          total
          detected
        }
      }
      infrastructure {
        headers {
          server
          cdn
        }
        server {
          ipAddress
          location {
            city
            country
          }
        }
      }
    }
    traffic {
      rank
      traffic {
        range {
          lowEstimate
          highEstimate
        }
        estimatedMonthlyVisits
      }
      similarWebRank
      confidence
    }
    firmographics {
      basicInfo {
        name
        description
      }
      metrics {
        monthlyTraffic
      }
    }
  }
}
```

### Example Batch Analysis

```graphql
query {
  batchAnalyzeSites(urls: ["example1.com", "example2.com"]) {
    url
    technical {
      wordpress {
        core {
          detected
        }
      }
    }
    traffic {
      rank
    }
  }
}
```

## REST API

### Full Analysis

`POST /api/analysis/single`

```json
{
  "url": "example.com"
}
```

`POST /api/analysis/batch`

```json
{
  "urls": ["example1.com", "example2.com"]
}
```

### Individual Services

```bash
POST /api/analysis/crux
POST /api/analysis/psi
POST /api/analysis/technical
POST /api/analysis/traffic
POST /api/analysis/company
```

All individual endpoints accept:

```json
{
    "url": "example.com"
}
```

#### Example Response (Technical Analysis):

```json
{
  "wordpress": {
    "core": {
      "detected": true,
      "version": "6.3.1",
      "features": {
        "rss": true,
        "adminAccess": true
      }
    },
    "theme": {
      "name": "astra",
      "childTheme": true,
      "customCss": true
    },
    "plugins": {
      "total": 12,
      "detected": [
        "elementor",
        "woocommerce",
        "yoast-seo"
      ]
    }
  },
  "infrastructure": {
    "headers": {
      "server": "nginx/1.18.0",
      "cdn": ["cloudflare"]
    },
    "server": {
      "ipAddress": "104.21.63.91",
      "location": {
        "city": "San Francisco",
        "country": "US"
      }
    }
  }
}
```

## Rate Limiting

Default rate limits:
- 100 requests per minute per IP for REST endpoints

## Error Handling

All endpoints return structured error responses:

```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "status": 400
}
```

## Development

```bash
npm run lint     # Run ESLint
npm test        # Run tests
```

## License

MIT

Copyiright (c) 2025 Robert Li

### Disclaimer

This software is provided "as is" without warranty of any kind, express or implied. The authors make no warranties, express or implied, that this software is free of error, or will meet your requirements, or that the service will be uninterrupted.

The authors will not be liable for any direct, indirect, consequential or incidental damages arising from the use or inability to use this software or its documentation.

### Service Usage

When using this software, you agree to:
1. Respect the terms of service of all external APIs (CrUX, PageSpeed Insights, SimilarWeb, Diffbot)
2. Comply with the robots.txt and rate limiting policies of analyzed websites
3. Obtain necessary API keys and permissions for commercial use
4. Use the traffic and company data estimates for informational purposes only
5. Not attempt to circumvent any access controls or security measures

### Data Accuracy

The analysis results, including but not limited to:
- Traffic estimates
- WordPress detection
- Company information
- Technical infrastructure details

Are provided as estimates based on available data. No guarantee of accuracy is provided or implied.

### API Keys and Credentials

Users are responsible for:
1. Obtaining valid API keys for all services
2. Managing API quota and usage limits
3. Costs associated with API calls
4. Securing their API credentials