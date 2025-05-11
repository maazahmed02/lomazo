// Environment-specific configuration
// These values can be overridden by environment variables in production

// API endpoint URLs
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050/api';
export const DOCUMENTS_API_URL = `${API_BASE_URL}/documents`;
export const LIFESTYLE_API_URL = `${API_BASE_URL}/lifestyle`;

// App settings
export const APP_VERSION = "1.0.0";
export const DEFAULT_PATIENT_ID = "1";

// Feature flags
export const ENABLE_TRANSLATIONS = true;
export const ENABLE_GEMINI_SUMMARIES = true; 