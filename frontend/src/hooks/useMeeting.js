// Purpose: Meeting hook
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { setMeetings, setLoading } from '../redux/slices/meetingSlice';
import { meetingService } from '../services/meetingService';

export const useMeeting = () => {
  const dispatch = useDispatch();
  const { meetings, loading } = useSelector((state) => state.meeting);

  useEffect(() => {
    const fetchMeetings = async () => {
      dispatch(setLoading(true));
      try {
        const response = await meetingService.getMeetings();
        dispatch(setMeetings(response.data.data));
      } catch (error) {
        console.error(error);
      } finally {
        dispatch(setLoading(false));
      }
    };

    fetchMeetings();
  }, [dispatch]);

  return { meetings, loading };
};