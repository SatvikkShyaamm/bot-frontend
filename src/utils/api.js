import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // Send cookies with every request
  headers: { 'Content-Type': 'application/json' }
});

// No tokens in localStorage — auth is entirely via HttpOnly cookie
// This file is just a configured axios instance

export default api;
