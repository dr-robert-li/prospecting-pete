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
    score: Float!
    metrics: PageSpeedMetrics!
  }

  type PageSpeedMetrics {
    firstContentfulPaint: Float!
    speedIndex: Float!
    largestContentfulPaint: Float!
    timeToInteractive: Float!
  }

  type TechnicalData {
    wordpress: WordPressData
    infrastructure: InfrastructureData
  }

  type WordPressData {
    core: WPCore
    theme: WPTheme
    plugins: WPPlugins
    customization: WPCustomization
    endpoints: WPEndpoints
  }

  type WPCore {
    detected: Boolean!
    version: String
    features: WPFeatures
  }

  type WPFeatures {
    rss: Boolean!
    adminAccess: Boolean!
  }

  type WPTheme {
    name: String
    childTheme: Boolean!
    customCss: Boolean!
  }

  type WPPlugins {
    total: Float!
    detected: [String!]!
    common: [String!]!
  }

  type WPCustomization {
    customPostTypes: [String!]!
    shortcodes: [String!]!
    widgetAreas: [WidgetArea!]!
    customizer: Boolean!
  }

  type WidgetArea {
    id: String
    class: String
  }

  type WPEndpoints {
    wpJson: EndpointStatus
    wpAdmin: EndpointStatus
    wpLogin: EndpointStatus
    xmlrpc: EndpointStatus
  }

  type EndpointStatus {
    path: String!
    accessible: Boolean!
    status: Float!
  }

  type InfrastructureData {
    headers: HeaderInfo
    server: ServerInfo
  }

  type HeaderInfo {
    server: String
    poweredBy: String
    caching: CacheInfo
    security: SecurityHeaders
    compression: String
    cdn: [String!]
  }

  type CacheInfo {
    control: String
    expires: String
    etag: String
  }

  type SecurityHeaders {
    hsts: String
    xssProtection: String
    contentSecurityPolicy: String
    frameOptions: String
  }

  type ServerInfo {
    ipAddress: String!
    host: String!
    location: GeoLocation
    provider: String
    asn: String
    hosting: String
  }

  type GeoLocation {
    city: String
    region: String
    country: String
    coordinates: String
  }

  type TrafficData {
    rank: Float
    traffic: TrafficMetrics
    confidence: Float!
    similarWebRank: Float
    lastUpdated: String
  }

  type TrafficMetrics {
    range: TrafficRange!
    estimatedMonthlyVisits: Float!
  }

  type TrafficRange {
    lowEstimate: String!
    highEstimate: String!
  }

  type FirmographicData {
    basicInfo: BasicInfo
    financials: Financials
    classification: Classification
    contact: ContactInfo
    social: SocialProfiles
    people: PeopleInfo
    relationships: Relationships
    metrics: CompanyMetrics
  }

  type BasicInfo {
    name: String
    description: String
    foundingDate: String
    isAcquired: Boolean
    isDissolved: Boolean
    isNonProfit: Boolean
    homepageUri: String
    wikipediaUri: String
  }

  type Financials {
    revenue: String
    totalInvestment: String
    investments: [Investment]
  }

  type Investment {
    date: String
    amount: String
    series: String
    investors: [String]
  }

  type Classification {
    naics: String
    sic: String
    categories: [String]
    descriptors: [String]
  }

  type ContactInfo {
    emailAddresses: [String]
    phoneNumbers: [String]
  }

  type SocialProfiles {
    twitter: String
    linkedin: String
    facebook: String
    github: String
    blog: String
  }

  type PeopleInfo {
    employeesMin: Float
    employeesMax: Float
    founders: [String]
    ceo: String
  }

  type Relationships {
    competitors: [String]
    customers: [String]
    partnerships: [String]
    suppliers: [String]
  }

  type CompanyMetrics {
    monthlyTraffic: Float
    importance: Float
    wikipediaPageviews: WikipediaMetrics
  }

  type WikipediaMetrics {
    lastYear: Float
    growth: Float
  }

  type Query {
    analyzeSite(url: String!): SiteAnalysis!
    batchAnalyzeSites(urls: [String!]!): [SiteAnalysis!]!
  }

  scalar JSON
`;

export default typeDefs;
