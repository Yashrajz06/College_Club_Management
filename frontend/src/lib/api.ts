const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  const collegeId = localStorage.getItem('collegeId');

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(collegeId && { 'x-college-id': collegeId }),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'API request failed');
  }

  return response.json();
};
