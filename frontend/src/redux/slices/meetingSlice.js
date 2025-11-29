// Purpose: Meeting state management
import { createSlice } from '@reduxjs/toolkit';

const meetingSlice = createSlice({
  name: 'meeting',
  initialState: {
    meetings: [],
    currentMeeting: null,
    loading: false,
    error: null,
  },
  reducers: {
    setMeetings: (state, action) => { state.meetings = action.payload; },
    setCurrentMeeting: (state, action) => { state.currentMeeting = action.payload; },
    setLoading: (state, action) => { state.loading = action.payload; },
  },
});

export const { setMeetings, setCurrentMeeting, setLoading } = meetingSlice.actions;
export default meetingSlice.reducer;