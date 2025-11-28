const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
      set(value) {
        // Store email in lowercase
        this.setDataValue('email', value.toLowerCase());
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fullName: {
      type: DataTypes.VIRTUAL,
      get() {
        return `${this.firstName} ${this.lastName}`;
      },
    },
    profileImage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('admin', 'manager', 'member'),
      defaultValue: 'member',
    },
    googleId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    googleTokens: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    // Add these fields after 'googleTokens'
    verificationToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    verificationExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    timezone: {
      type: DataTypes.STRING,
      defaultValue: 'UTC',
    },
    preferences: {
      type: DataTypes.JSON,
      defaultValue: {
        theme: 'light',
        emailNotifications: true,
        notificationFrequency: 'immediate',
        language: 'en',
      },
    },
    twoFactorEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    twoFactorSecret: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    paranoid: true,
    defaultScope: {
      attributes: { exclude: ['password', 'twoFactorSecret', 'googleTokens'] },
    },
    scopes: {
      withPassword: {
        attributes: { include: ['password'] },
      },
    },
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

// Instance Methods
User.prototype.comparePassword = async function (password) {
  // Get the actual password value from dataValues
  const hashedPassword = this.getDataValue('password');
  return await bcrypt.compare(password, hashedPassword);
};

User.prototype.toJSON = function () {
  // Use getters instead of this.toJSON() to avoid recursion
  const values = { ...this.get() };
  delete values.password;
  delete values.twoFactorSecret;
  delete values.googleTokens;
  return values;
};

// Class Methods
User.findByEmail = async function (email) {
  return await this.scope('withPassword').findOne({
    where: { email: email.toLowerCase() },
  });
};

User.findByGoogleId = async function (googleId) {
  return await this.findOne({
    where: { googleId },
  });
};

module.exports = User;