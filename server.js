import express from 'express';


const port = process.env.PORT || 5050;


const app = express();

app.use(express.json());

app.listen(port, () => console.log(`Server listening on port : ${port}`));
