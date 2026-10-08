require('dotenv').config({ quiet: true });

const nodeEnv = process.env.NODE_ENV || 'development';
const isTest = nodeEnv === 'test';

const num = (value, fallback) => {
  const n = Number(value);
  return value === undefined || value === '' || Number.isNaN(n) ? fallback : n;
};

const env = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  isTest,
  port: num(process.env.PORT, 5000),
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET || (isTest ? 'test-secret-test-secret-test-secret-123' : undefined),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173,http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  // Business rules (PKR)
  deliveryFee: num(process.env.DELIVERY_FEE, 150),
  taxRateOnline: num(process.env.TAX_RATE_ONLINE, 0),
  taxRatePos: num(process.env.TAX_RATE_POS, 5),
  maxLineQuantity: 50,
};

env.cloudinary.enabled = Boolean(env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret);

if (!isTest) {
  const missing = [];
  if (!env.mongoUri) missing.push('MONGODB_URI');
  if (!env.jwtSecret) missing.push('JWT_SECRET');
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}. Copy .env.example to .env.`);
  }
  if (env.isProduction && env.jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production.');
  }
}

module.exports = env;
