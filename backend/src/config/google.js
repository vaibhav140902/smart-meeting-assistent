const { google } = require('googleapis');
const logger = require('../middleware/logger');

// OAuth2 Client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL
);

// Google Meet API
const meet = google.meet({
  version: 'v2',
  auth: oauth2Client,
});

// Google Calendar API
const calendar = google.calendar({
  version: 'v3',
  auth: oauth2Client,
});

// Google Drive API
const drive = google.drive({
  version: 'v3',
  auth: oauth2Client,
});

// Generate OAuth URL
const getOAuthUrl = () => {
  const scopes = [
    'https://www.googleapis.com/auth/meetings.space.created',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });
};

// Exchange code for tokens
const getTokensFromCode = async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    logger.info('Google tokens obtained successfully');
    return tokens;
  } catch (error) {
    logger.error('Error exchanging code for tokens:', error);
    throw new Error('Failed to obtain Google tokens');
  }
};

// Refresh tokens
const refreshTokens = async (refreshToken) => {
  try {
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials;
  } catch (error) {
    logger.error('Error refreshing tokens:', error);
    throw new Error('Failed to refresh Google tokens');
  }
};

// Create Google Meet Space
const createMeetingSpace = async (accessToken) => {
  try {
    oauth2Client.setCredentials({ access_token: accessToken });

    const result = await meet.spaces.create({
      requestBody: {
        config: {
          accessType: 'OPEN',
        },
      },
    });

    logger.info('Google Meet space created:', result.data.name);
    return {
      meetingId: result.data.name,
      meetingUri: result.data.meetingUri,
      conferenceData: result.data.conferenceData,
    };
  } catch (error) {
    logger.error('Error creating Google Meet space:', error);
    throw new Error('Failed to create Google Meet space');
  }
};

// Get meeting details
const getMeetingDetails = async (accessToken, meetingId) => {
  try {
    oauth2Client.setCredentials({ access_token: accessToken });

    const result = await meet.spaces.get({
      name: meetingId,
    });

    return result.data;
  } catch (error) {
    logger.error('Error fetching meeting details:', error);
    throw new Error('Failed to fetch meeting details');
  }
};

// Create calendar event
const createCalendarEvent = async (accessToken, eventData) => {
  try {
    oauth2Client.setCredentials({ access_token: accessToken });

    const event = {
      summary: eventData.title,
      description: eventData.description,
      start: {
        dateTime: eventData.startTime,
        timeZone: 'UTC',
      },
      end: {
        dateTime: eventData.endTime,
        timeZone: 'UTC',
      },
      attendees: eventData.attendees || [],
      conferenceData: {
        createRequest: {
          requestId: `meeting-${Date.now()}`,
          conferenceSolutionKey: {
            key: 'addOnType_ical_eventtype_meet',
          },
        },
      },
    };

    const result = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,
    });

    logger.info('Calendar event created:', result.data.id);
    return result.data;
  } catch (error) {
    logger.error('Error creating calendar event:', error);
    throw new Error('Failed to create calendar event');
  }
};

// Upload to Google Drive
const uploadToDrive = async (accessToken, fileName, fileContent, folderId) => {
  try {
    oauth2Client.setCredentials({ access_token: accessToken });

    const fileMetadata = {
      name: fileName,
      parents: folderId ? [folderId] : undefined,
    };

    const media = {
      mimeType: 'application/octet-stream',
      body: fileContent,
    };

    const result = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink',
    });

    logger.info('File uploaded to Google Drive:', result.data.id);
    return result.data;
  } catch (error) {
    logger.error('Error uploading to Google Drive:', error);
    throw new Error('Failed to upload to Google Drive');
  }
};

module.exports = {
  oauth2Client,
  meet,
  calendar,
  drive,
  getOAuthUrl,
  getTokensFromCode,
  refreshTokens,
  createMeetingSpace,
  getMeetingDetails,
  createCalendarEvent,
  uploadToDrive,
};