/**
 * Returns the base URL for backend API calls.
 * - In production, VITE_API_URL points to the Render backend (e.g. https://your-app.onrender.com)
 * - In local development, it defaults to '' so that Vite's dev proxy handles /api/* routes
 */
export const API_BASE = import.meta.env.VITE_API_URL || '';
