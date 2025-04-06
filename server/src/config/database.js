const mongoose = require('mongoose');

/**
 * Connect to MongoDB database with advanced configuration
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Modern connection options (mongoose 6+)
      serverSelectionTimeoutMS: 5000, // Timeout for server selection
      maxPoolSize: 10, // Maximum number of connections in the connection pool
      family: 4, // Use IPv4, skip trying IPv6
    });

    const db = mongoose.connection;

    // Set up connection event handlers
    db.on('error', (err) => {
      console.error(`MongoDB connection error: ${err.message}`);
      process.exit(1);
    });

    db.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    db.on('reconnected', () => {
      console.info('MongoDB reconnected successfully');
    });

    // Log successful connection
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);
    
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Gracefully close the MongoDB connection
 */
const closeConnection = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed gracefully');
    return true;
  } catch (error) {
    console.error(`Error closing MongoDB connection: ${error.message}`);
    return false;
  }
};

module.exports = {
  connectDB,
  closeConnection
};
