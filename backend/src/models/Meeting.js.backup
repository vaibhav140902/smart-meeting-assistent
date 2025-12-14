const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');
const { Team } = require('./Team');

const Meeting = sequelize.define(
  'Meeting',
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
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    teamId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Teams',
        key: 'id',
      },
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    actualEndTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'ongoing', 'completed', 'cancelled', 'paused'),
      defaultValue: 'scheduled',
    },
    googleMeetId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    meetingLink: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    recordingUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    recordingDuration: {
      type: DataTypes.INTEGER,
      allowNull: true, // in seconds
    },
    recordingSize: {
      type: DataTypes.BIGINT,
      allowNull: true, // in bytes
    },
    isRecorded: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    participants: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    participantCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    agenda: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    settings: {
      type: DataTypes.JSON,
      defaultValue: {
        enableTranscription: true,
        enableSummary: true,
        enableActionItems: true,
        enableSpeakerDiarization: true,
        language: 'en-US',
        isPublic: false,
      },
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

// Meeting Participants Junction Table
const MeetingParticipant = sequelize.define(
  'MeetingParticipant',
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
        model: 'Meetings',
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
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    joinTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    leftTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true, // in seconds
    },
    role: {
      type: DataTypes.ENUM('organizer', 'presenter', 'attendee'),
      defaultValue: 'attendee',
    },
    status: {
      type: DataTypes.ENUM('invited', 'accepted', 'declined', 'attended', 'no-show'),
      defaultValue: 'invited',
    },
    speakingTime: {
      type: DataTypes.INTEGER,
      defaultValue: 0, // in seconds
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
  },
  {
    timestamps: true,
  }
);

// Associations
Meeting.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
Meeting.belongsTo(Team, { foreignKey: 'teamId' });
Meeting.hasMany(MeetingParticipant, { foreignKey: 'meetingId', onDelete: 'CASCADE' });

User.hasMany(Meeting, { foreignKey: 'createdBy' });
User.hasMany(MeetingParticipant, { foreignKey: 'userId' });

Team.hasMany(Meeting, { foreignKey: 'teamId' });

MeetingParticipant.belongsTo(Meeting, { foreignKey: 'meetingId' });
MeetingParticipant.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  Meeting,
  MeetingParticipant,
};