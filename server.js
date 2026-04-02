import cookieParser from 'cookie-parser';
import express from 'express';

import asyncHandler from './middleware/async.js';
import errorHandler from './middleware/error.js';
import notFoundHandler from './middleware/notFound.js';
import auth from './routes/auth.js'
import books from './routes/books.js'
import reviews from './routes/reviews.js'
import user from './routes/user.js'

const port = process.env.PORT || 5050;


const app = express();

// Error middlewares
app.use(asyncHandler);
app.use(notFoundHandler);
app.use(errorHandler);

// utils
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', auth);
app.use('/api/books', books);
app.use('/api/user', user);
app.use('/api/reviews', reviews);

app.listen(port, () => console.log(`Server listening on port : ${port}`));
