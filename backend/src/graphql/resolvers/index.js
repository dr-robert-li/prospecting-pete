import siteAnalysisResolvers from './siteAnalysis.js';
import batchResolvers from './batch.js';
import { GraphQLJSON } from 'graphql-type-json';

export default {
  JSON: GraphQLJSON,
  Query: {
    ...siteAnalysisResolvers.Query,
    ...batchResolvers.Query
  }
};
