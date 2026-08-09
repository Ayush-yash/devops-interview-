import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ai-devops-interview';
    
    // Add connection listeners
    mongoose.connection.on('connected', () => {
      console.log('[Mongoose] Connected to MongoDB successfully.');
    });

    mongoose.connection.on('error', (err) => {
      console.error(`[Mongoose] Connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[Mongoose] Disconnected from MongoDB.');
    });

    const conn = await mongoose.connect(mongoUri);
    console.log(`[Mongoose] Database host: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Mongoose] Error connecting to MongoDB: ${error}`);
    process.exit(1);
  }
};

export default connectDB;
