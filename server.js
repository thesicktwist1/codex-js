import express from 'express';

import asyncHandler from './middleware/async';
import errorHandler from './middleware/error';
import notFoundHandler from './middleware/notFound';

const port = process.env.PORT || 5050;


const app = express();

// Error handlers
app.use(asyncHandler);
app.use(notFoundHandler);
app.use(errorHandler);

app.use(express.json());

app.listen(port, () => console.log(`Server listening on port : ${port}`));
