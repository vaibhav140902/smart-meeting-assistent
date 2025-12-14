const { DataTypes } = require('sequelize');

// The model function is exported, which is standard for Sequelize setup via index.js
module.exports = (sequelize, DataTypes) => {
  const ActionItemComment = sequelize.define(
    'ActionItemComment',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      actionItemId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'ActionItems', // References the ActionItems table
          key: 'id',
        },
        field: 'action_item_id',
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Users', // References the Users table
          key: 'id',
        },
        field: 'user_id',
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      tableName: 'action_item_comments',
      timestamps: true,
      underscored: true,
    }
  );

  ActionItemComment.associate = (models) => {
    // Relationships (moved from the external block)
    ActionItemComment.belongsTo(models.ActionItem, { foreignKey: 'actionItemId', as: 'ActionItem' });
    ActionItemComment.belongsTo(models.User, { foreignKey: 'userId', as: 'User' });
    
    // User association that belongs here
    models.User.hasMany(ActionItemComment, { foreignKey: 'userId' });
  };

  return ActionItemComment;
};