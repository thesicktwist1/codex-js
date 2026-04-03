import {MongoClient} from 'mongodb';

const uri = process.env.ATLAS_URI || '';

const client = new MongoClient(uri);

const database = client.db('codex-js');


try {
  await database.collection('users').createIndex({email: 1}, {unique: true});

  await database.collection('reviews').createIndex(
      {userId: 1, bookId: 1}, {unique: true});

  await database.collection('books').createIndex({title: 1}, {unique: true});

  await database.collection('refreshToken')
      .createIndex({userId: 1, session: 1}, {unique: true});
} catch (err) {
  if (err.code !== 11000) {
    console.error('Error creating indexes:', err);
    throw err;
  }
};



export default database;
