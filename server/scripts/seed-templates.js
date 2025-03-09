#!/usr/bin/env node

/**
 * Script to seed workflow templates
 * 
 * Usage: node scripts/seed-templates.js
 */

const knex = require('knex');
const path = require('path');
const config = require('../knexfile.cjs');
const seedFile = require('../seeds/20250308_workflow_templates.cjs');

async function seedTemplates() {
  console.log('Seeding workflow templates...');
  
  // Create knex instance
  const knexInstance = knex(config.development);
  
  try {
    // Run the seed function
    await seedFile.seed(knexInstance);
    console.log('Workflow templates seeded successfully!');
  } catch (error) {
    console.error('Error seeding workflow templates:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    await knexInstance.destroy();
  }
}

// Run the seed function
seedTemplates();