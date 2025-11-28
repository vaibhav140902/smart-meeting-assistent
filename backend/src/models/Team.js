const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const Team = sequelize.define(
  'Team',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    logo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    settings: {
      type: DataTypes.JSON,
      defaultValue: {
        maxMembers: 50,
        recordingEnabled: true,
        transcriptionEnabled: true,
        summaryEnabled: true,
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    paranoid: true,
  }
);

// Team Members Junction Table
const TeamMember = sequelize.define(
  'TeamMember',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    teamId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Teams',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    role: {
      type: DataTypes.ENUM('owner', 'admin', 'member'),
      defaultValue: 'member',
    },
    joinedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: true,
  }
);

// Associations
Team.belongsTo(User, { as: 'owner', foreignKey: 'ownerId' });
Team.hasMany(TeamMember, { foreignKey: 'teamId', onDelete: 'CASCADE' });

User.hasMany(Team, { foreignKey: 'ownerId' });
User.hasMany(TeamMember, { foreignKey: 'userId', onDelete: 'CASCADE' });

TeamMember.belongsTo(Team, { foreignKey: 'teamId' });
TeamMember.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  Team,
  TeamMember,
};