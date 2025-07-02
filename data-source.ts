import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
// We do not need to import individual entities here when using file paths

// Load environment variables from .env file for local development
dotenv.config();

// Determine if we are in a production environment (like Render) by checking for DATABASE_URL
const isProduction = !!process.env.DATABASE_URL;

// Define the configuration options object
const options: DataSourceOptions = {
  type: 'postgres',

  // If we are in production, use the DATABASE_URL and enable SSL.
  // Otherwise, these will be undefined and we'll use the local settings below.
  url: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,

  // Use the correct paths for entities and migrations based on the environment.
  // In production, we use the compiled .js files from the 'dist' folder.
  // Locally, we use the .ts files from the 'src' folder.
  entities: [
    isProduction
      ? 'dist/src/entities/**/*.entity.js'
      : 'src/entities/**/*.entity.ts',
  ],
  migrations: [
    isProduction
      ? 'dist/src/migrations/**/*.js'
      : 'src/migrations/**/*.ts',
  ],

  synchronize: false,
  logging: true, // Keep true for debugging, can be set to false in production later
};

// If we are NOT in production, fill in the connection details
// for the local database from the other .env variables.
if (!isProduction) {
  Object.assign(options, {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
}

// Export the configured DataSource
export const AppDataSource = new DataSource(options);