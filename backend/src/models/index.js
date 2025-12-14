const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/database');
const logger = require('../middleware/logger');
const User = require('./User'); 
const db = {};

// Read all files in the current directory (models directory)
fs.readdirSync(__dirname)
  .filter(file => {
    // Exclude index.js itself and hidden files
    return (
      file.indexOf('.') !== 0 && file !== path.basename(__filename) && file.slice(-3) === '.js'
    );
  })
  .forEach(file => {
    // Import the model definition and associate it with the sequelize instance
    try {
        const model = require(path.join(__dirname, file));
        // We assume model definition files (like user.js) export the defined model directly.
        // sequelize.models will contain the loaded model.
        db[model.name] = model;
    } catch (e) {
        // Log an error if a model file fails to load
        logger.error(`Error loading model file ${file}:`, e.message);
    }
  });

// Run associations (if any)
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = require('sequelize');

// Export models directly (e.g., db.User, db.Post)
// For controllers, you will now import db.User
module.exports = db;
module.exports = {
  User,
};