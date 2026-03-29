import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = axios.create({ baseURL: BASE_URL });

export const fetchSummary         = (user) => api.get(`/dashboard/summary/${user}`);
export const fetchAppUsage        = (user) => api.get(`/dashboard/app-usage/${user}`);
export const fetchActivityTimeline= (user) => api.get(`/dashboard/activity-timeline/${user}`);
export const fetchScreenshots     = (user) => api.get(`/dashboard/screenshots/${user}`);
export const fetchCamera          = (user) => api.get(`/dashboard/camera/${user}`);
