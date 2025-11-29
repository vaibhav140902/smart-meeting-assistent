// Purpose: Meeting API calls
import api from './api';

export const meetingService = {
  getMeetings: () => api.get('/meetings'),
  getMeeting: (id) => api.get(`/meetings/${id}`),
  createMeeting: (data) => api.post('/meetings', data),
  updateMeeting: (id, data) => api.put(`/meetings/${id}`, data),
  deleteMeeting: (id) => api.delete(`/meetings/${id}`),
};

// ---