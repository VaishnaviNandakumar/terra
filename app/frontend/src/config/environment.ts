export const environment = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000'
};

// More detailed debugging
console.log('Environment Variables:', {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  MODE: import.meta.env.MODE,
  environment: environment
}); 