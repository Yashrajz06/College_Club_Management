export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const buildApiHeaders = (headers: HeadersInit = {}) => {
  const token = localStorage.getItem('token');
  const collegeId = localStorage.getItem('collegeId');

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(collegeId ? { 'x-college-id': collegeId } : {}),
    ...headers,
  };
};

export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {},
) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: buildApiHeaders(options.headers),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      Array.isArray(errorData.message)
        ? errorData.message.join(', ')
        : errorData.message || 'API request failed',
    );
  }

  return response;
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const response = await apiRequest(endpoint, options);

  if (response.status === 204) {
    return null;
  }

  return response.json();
};
