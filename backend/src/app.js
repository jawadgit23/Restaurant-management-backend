const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/env');
const routes = require('./routes');
const sanitize = require('./middleware/sanitize.middleware');
const { apiLimiter } = require('./middleware/rateLimit.middleware');
const { notFound, errorHandler } = require('./middleware/error.middleware');
const ApiError = require('./utils/ApiError');

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin(origin, cb) {
      // no Origin header = curl / Postman / server-to-server
      if (!origin || env.clientUrls.includes(origin)) return cb(null, true);
      return cb(ApiError.forbidden(`Origin ${origin} is not allowed by CORS`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  })
);
if (!env.isTest) app.use(morgan(env.isProduction ? 'combined' : 'dev'));
app.use(express.json({ limit: '100kb' }));
app.use(sanitize);
app.use('/api', apiLimiter, routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
