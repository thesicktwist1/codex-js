import express from 'express';
import MongoClient from 'mongodb';



const port = process.env.PORT || 8000;


const app = express();


app.listen(port, () => console.log(`Server listening on port : ${port}`))
