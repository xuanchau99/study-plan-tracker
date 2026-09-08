export const API_BASE_URL = 'http://localhost:8080/api/v1';

/**
 * A wrapper around the native browser fetch API.
 * Automatically injects the JWT token into the Authorization header
 * and handles global error states like 401 Unauthorized.
 */
export const fetchApi = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle HTTP errors
  if (!response.ok) {
    // If the token is invalid or expired, forcefully log the user out
    if (response.status === 401 || response.status === 403) {
      localStorage.clear();
      window.location.href = '/login';
      return null;
    }
    
    // Attempt to extract the custom error message from the backend
    let errorMsg = `API Error: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMsg = errorData.message || errorMsg;
    } catch(e) {}
    throw new Error(errorMsg);
  }
  
  // Return null for responses with no body (e.g., 202 Accepted, 204 No Content)
  if (response.status === 202 || response.status === 204) {
    return null;
  }
  
  // Parse and return JSON response
  return response.json();
};
