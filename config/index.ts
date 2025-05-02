const isProd = process.env.NODE_ENV === 'production';

export const config = {
  apiUrl: isProd ? '/api' : 'http://localhost:3000/api',
  // Add other configuration values here
};

export default config;