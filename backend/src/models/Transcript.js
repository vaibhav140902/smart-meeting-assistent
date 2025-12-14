const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Transcript = sequelize.define(
  'Transcript',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    meetingId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'meetings',
        key: 'id',
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    speaker: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    timestamp: {
      type: DataTypes.INTEGER, // seconds from meeting start
      allowNull: false,
    },
    confidence: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    tableName: 'transcripts',
  }
);

module.exports = Transcript;