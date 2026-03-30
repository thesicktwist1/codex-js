import {MongoClient} from 'mongodb';

const connectionString = process.env.ATLAS_URI || '';

const client = new MongoClient(connectionString);

let conn;
let db;
try {
  conn = await client.connect();
  db = conn.db('codex-js');
  await db.createCollection('users');
} catch (err) {
  throw err
}



export default db;
