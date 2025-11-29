import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import { login, logout, register } from '../redux/slices/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, loading, error } = useSelector((state) => state.auth);

  const handleLogin = useCallback((email, password) => {
    dispatch(login({ email, password }));
  }, [dispatch]);

  const handleRegister = useCallback((userData) => {
    dispatch(register(userData));
  }, [dispatch]);

  const handleLogout = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  return { user, isAuthenticated, loading, error, handleLogin, handleLogout, handleRegister };
};