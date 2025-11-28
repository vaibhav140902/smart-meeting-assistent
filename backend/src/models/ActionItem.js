const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');
const { Meeting } = require('./Meeting');

const ActionItem = sequelize.define(
  'ActionItem',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    meetingId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Meetings',
        key: 'id',
      },
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    assignedTo: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('open', 'in_progress', 'completed', 'cancelled'),
      defaultValue: 'open',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium',
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    extractedFromTranscription: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    extractedText: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    relatedSentences: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    tags: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
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

// ActionItem Comments Table
const ActionItemComment = sequelize.define(
  'ActionItemComment',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    actionItemId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'ActionItems',
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
    comment: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    timestamps: true,
  }
);

// Associations
ActionItem.belongsTo(Meeting, { foreignKey: 'meetingId' });
ActionItem.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
ActionItem.belongsTo(User, { as: 'assignee', foreignKey: 'assignedTo' });
ActionItem.belongsTo(User, { as: 'completedByUser', foreignKey: 'completedBy' });
ActionItem.hasMany(ActionItemComment, { foreignKey: 'actionItemId', onDelete: 'CASCADE' });

User.hasMany(ActionItem, { as: 'createdActionItems', foreignKey: 'createdBy' });
User.hasMany(ActionItem, { as: 'assignedActionItems', foreignKey: 'assignedTo' });
User.hasMany(ActionItemComment, { foreignKey: 'userId' });

Meeting.hasMany(ActionItem, { foreignKey: 'meetingId', onDelete: 'CASCADE' });

ActionItemComment.belongsTo(ActionItem, { foreignKey: 'actionItemId' });
ActionItemComment.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  ActionItem,
  ActionItemComment,
};