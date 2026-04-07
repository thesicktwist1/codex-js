import {MongoClient} from 'mongodb';

/**
 * Database connection and initialization.
 *
 * Ensures `ATLAS_URI` is provided, connects to MongoDB, and creates the
 * required unique indexes used by the application. Exports the connected
 * `database` object for use throughout the app.
 */
const uri = process.env.ATLAS_URI || '';

if (!uri) {
  throw new Error(
      'Database connection URI not provided. Set ATLAS_URI environment variable.');
}

const client = new MongoClient(uri);

const database = client.db('codex-js');

// Initialize database connection and create indexes
try {
  await database.collection('users').createIndex({email: 1}, {unique: true});

  await database.collection('reviews').createIndex(
      {userId: 1, bookId: 1}, {unique: true});

  await database.collection('books').createIndex({title: 1}, {unique: true});

  await database.collection('refreshToken')
      .createIndex({userId: 1, session: 1}, {unique: true});

  console.log('Database connected and indexes created successfully');
} catch (err) {
  if (err.code !== 11000) {
    console.error('Error initializing database connection:', err);
    throw err;
  }
};



export default database;
