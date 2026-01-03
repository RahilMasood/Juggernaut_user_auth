#!/usr/bin/env node

/**
 * Database setup script that creates the database using Node.js
 * Run with: node scripts/setup-db.js
 */

require('dotenv').config();
const { Client } = require('pg');
const logger = require('../src/utils/logger');

async function setupDatabase() {
  console.log('\n🗄️  Setting up PostgreSQL database...\n');

  const dbName = process.env.DB_NAME || 'audit_software';
  
  // Connect to postgres database first to create our database
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: 'postgres' // Connect to default postgres database
  });

  try {
    console.log('Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected to PostgreSQL\n');

    // Check if database exists
    const checkDb = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (checkDb.rows.length > 0) {
      console.log(`ℹ️  Database '${dbName}' already exists\n`);
    } else {
      // Create database
      console.log(`Creating database '${dbName}'...`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Database '${dbName}' created successfully\n`);
    }

    console.log('✅ Database setup complete!\n');
    console.log('Next steps:');
    console.log('1. Run migrations: npm run migrate');
    console.log('2. Seed admin user: npm run seed-admin');
    console.log('3. Start server: npm run dev\n');

  } catch (error) {
    console.error('\n❌ Database setup failed:\n');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Cannot connect to PostgreSQL server.');
      console.error('\nPossible solutions:');
      console.error('1. Install PostgreSQL:');
      console.error('   brew install postgresql@15');
      console.error('   brew services start postgresql@15\n');
      console.error('2. Make sure PostgreSQL is running');
      console.error('3. Check your connection settings in .env file\n');
    } else if (error.code === '28P01') {
      console.error('❌ Authentication failed.');
      console.error('Check your DB_USER and DB_PASSWORD in .env file\n');
    } else {
      console.error('Error:', error.message);
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Check if .env exists
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '..', '.env');

if (!fs.existsSync(envPath)) {
  console.error('\n❌ .env file not found!\n');
  console.error('Please run: npm run setup\n');
  process.exit(1);
}

setupDatabase();

