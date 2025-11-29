// Purpose: Authentication state management
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import * as localStorage from '../../utils/localStorage';

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const response = await api.post('/auth/login', credentials);
    localStorage.setTokens(response.data.data.accessToken, response.data.data.refreshToken);
    localStorage.setUser(response.data.data.user);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

export const register = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const response = await api.post('/auth/register', userData);
    localStorage.setTokens(response.data.data.accessToken, response.data.data.refreshToken);
    localStorage.setUser(response.data.data.user);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

export const logout = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await api.post('/auth/logout');
    localStorage.clearAll();
  } catch (error) {
    localStorage.clearAll();
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: localStorage.getUser() || null,
    accessToken: localStorage.getAccessToken() || null,
    isAuthenticated: !!localStorage.getAccessToken(),
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.loading = true; })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;