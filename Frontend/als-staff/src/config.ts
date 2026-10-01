// Empty string = same origin (dev server proxies /api to the backend, see vite.config.ts)
export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
