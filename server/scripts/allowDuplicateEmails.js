import '../loadEnv.js';
import mongoose from 'mongoose';

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI must be configured before running the email-index migration.');
}

try {
  await mongoose.connect(process.env.MONGODB_URI);
  const database = mongoose.connection.db;
  const usersCollectionExists = await database.listCollections({ name: 'users' }).hasNext();
  if (!usersCollectionExists) {
    await database.createCollection('users');
  }

  const collection = mongoose.connection.collection('users');
  const indexes = await collection.indexes();
  const uniqueEmailIndex = indexes.find((index) =>
    index.unique === true &&
    Object.keys(index.key || {}).length === 1 &&
    index.key.email === 1
  );

  if (uniqueEmailIndex) {
    await collection.dropIndex(uniqueEmailIndex.name);
    console.log(`Dropped unique email index "${uniqueEmailIndex.name}".`);
  } else {
    console.log('No unique email index found.');
  }

  await collection.createIndex({ email: 1 }, { name: 'email_1' });
  console.log('Ensured a non-unique email lookup index exists.');
} finally {
  await mongoose.disconnect();
}
