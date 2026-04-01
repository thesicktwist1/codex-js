import express from 'express';

import asyncHandler from './middleware/async.js';
import errorHandler from './middleware/error.js';
import notFoundHandler from './middleware/notFound.js';
import auth from './routes/auth.js'

const port = process.env.PORT || 5050;


const app = express();

// Error middlewares
app.use(asyncHandler);
app.use(notFoundHandler);
app.use(errorHandler);


app.use(express.json());

// Routes
app.use('/api/auth', auth);
// app.use('/api/books' books);

app.listen(port, () => console.log(`Server listening on port : ${port}`));
