import express from 'express';
import rateLimit from 'express-rate-limit';

import errorHandler from './middleware/error.js';
import notFoundHandler from './middleware/notFound.js';
import auth from './routes/auth.js';
import books from './routes/books.js';
import reviews from './routes/reviews.js';
import user from './routes/user.js';

// Validate required environment variables
const requiredEnvVars = ['ATLAS_URI', 'JWT_SECRET', 'REFRESH_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(
      `Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

const port = process.env.PORT || 5050;

const parserLimit = '1mb';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  ipv6Subnet: 56,
  message: 'Too many requests from this IP, please try again later.'
});

const app = express();

// utils
app.use(express.json({limit: parserLimit}));
app.use(limiter);

// Routes
app.use('/api/auth', auth);
app.use('/api/books', books);
app.use('/api/user', user);
app.use('/api/reviews', reviews);

// errors
app.use(notFoundHandler);
app.use(errorHandler);



app.listen(port, () => console.log(`Server listening on port : ${port}`));
