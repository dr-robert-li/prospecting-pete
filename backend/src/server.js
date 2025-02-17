import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import cors from 'cors';
import { json } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/env.js';
import apiRoutes from './routes/api/index.js';
import resolvers from './graphql/resolvers/index.js';
import typeDefs from './graphql/schema.js';
import logger from './utils/logger.js';

const app = express();

// Security and performance middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(json({ limit: '50mb' }));

// REST API routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// GraphQL server setup
const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => ({
    token: req.headers.authorization,
    ip: req.ip
  }),
  formatError: (error) => {
    logger.error('GraphQL Error:', error);
    return {
      message: error.message,
      path: error.path
    };
  }
});

await apolloServer.start();
apolloServer.applyMiddleware({ app });

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: config.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(config.PORT, () => {
  logger.info(`Server running on port ${config.PORT}`);
  logger.info(`GraphQL endpoint: ${apolloServer.graphqlPath}`);
  logger.info(`Environment: ${config.NODE_ENV}`);
});
