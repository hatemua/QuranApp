import mongoose from 'mongoose';
import { config } from './config.js';

export async function connectMongo(): Promise<typeof mongoose> {
  return mongoose.connect(config.MONGODB_URI);
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
}
