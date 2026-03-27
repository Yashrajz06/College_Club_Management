import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from './store';
import { setColleges, setCurrentCollegeId, setLoading } from './store/collegeSlice';

export const CollegeSwitcher: React.FC = () => {
  const dispatch = useDispatch();
  const { colleges, currentCollegeId, loading } = useSelector((state: RootState) => state.college);

  useEffect(() => {
    const fetchColleges = async () => {
      dispatch(setLoading(true));
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/colleges`);
        const data = await response.json();
        dispatch(setColleges(data));
        
        // If no college selected, pick the first one as default if available
        if (!currentCollegeId && data.length > 0) {
          dispatch(setCurrentCollegeId(data[0].id));
        }
      } catch (error) {
        console.error('Failed to fetch colleges', error);
      } finally {
        dispatch(setLoading(false));
      }
    };

    fetchColleges();
  }, [dispatch, currentCollegeId]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setCurrentCollegeId(e.target.value));
    // Optionally reload the page to refresh all data with the new collegeId
    window.location.reload();
  };

  if (loading && colleges.length === 0) return <div className="text-xs text-slate-400 animate-pulse">Loading colleges...</div>;

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="college-select" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">College:</label>
      <select
        id="college-select"
        value={currentCollegeId || ''}
        onChange={handleChange}
        className="text-sm font-medium bg-slate-100 border-none rounded-lg py-1 px-3 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
      >
        <option value="" disabled>Select College</option>
        {colleges.map((college: any) => (
          <option key={college.id} value={college.id}>
            {college.name}
          </option>
        ))}
      </select>
    </div>
  );
};
