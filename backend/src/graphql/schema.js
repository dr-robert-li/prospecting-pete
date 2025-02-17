import { gql } from 'apollo-server-express';

const typeDefs = gql`
  type SiteAnalysis {
    url: String!
    normalizedUrl: String
    cruxData: CruxMetrics
    pageSpeed: PageSpeedData
    technical: TechnicalData
    traffic: TrafficData
    firmographics: FirmographicData
  }

  type CruxMetrics {
    largest_contentful_paint: MetricData
    first_contentful_paint: MetricData
    interaction_to_next_paint: MetricData
    experimental_time_to_first_byte: MetricData
    cumulative_layout_shift: MetricData
  }

  type MetricData {
    p75: Float!
    rating: String!
    distribution: Distribution!
    histogram: [HistogramBucket!]!
  }

  type Distribution {
    good: Float!
    needsImprovement: Float!
    poor: Float!
  }

  type HistogramBucket {
    start: Float
    end: Float
    density: Float!
  }

  type PageSpeedData {
    score: Int
    metrics: PageSpeedMetrics
  }

  type PageSpeedMetrics {
    firstContentfulPaint: Float
    speedIndex: Float
    largestContentfulPaint: Float
    timeToInteractive: Float
  }

  type TechnicalData {
    headers: JSON
    ipAddress: String
    host: String
    sourceFiles: SourceFiles
    serverInfo: ServerInfo
  }

  type SourceFiles {
    scripts: [String]
    styles: [String]
    images: [String]
  }

  type ServerInfo {
    server: String
    poweredBy: String
  }

  type TrafficData {
    similarWebRank: Int
    estimatedRange: TrafficRange
    alexaEstimate: Int
    lastUpdated: String
  }

  type TrafficRange {
    lowEstimate: String
    highEstimate: String
  }

  type FirmographicData {
    name: String
    description: String
    employeeCount: Int
    revenue: String
    industry: String
    location: Location
    foundedYear: Int
    socialProfiles: SocialProfiles
  }

  type Location {
    city: String
    country: String
    latitude: Float
    longitude: Float
  }

  type SocialProfiles {
    linkedin: String
    twitter: String
  }

  type Query {
    analyzeSite(url: String!): SiteAnalysis!
    batchAnalyzeSites(urls: [String!]!): [SiteAnalysis!]!
  }

  scalar JSON
`;

export default typeDefs;
