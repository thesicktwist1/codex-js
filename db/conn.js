import {MongoClient} from 'mongodb';

const uri = process.env.ATLAS_URI || '';

const client = new MongoClient(uri);


const database = client.db('codex-js');


try {
  await database.createCollection('users');
  await database.createCollection('refreshToken');
} catch (err) {
  throw err
}

export default database;
