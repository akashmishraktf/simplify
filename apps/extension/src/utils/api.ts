import axios from 'axios';

const API_URL = 'http://localhost:3000';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use(async (config) => {
    const result = await chrome.storage.local.get(['access_token', 'gemini_api_key']);
    if (result.access_token) {
        config.headers.Authorization = `Bearer ${result.access_token}`;
    }
    if (result.gemini_api_key) {
        config.headers['x-gemini-api-key'] = result.gemini_api_key;
    }
    return config;
});

export const register = async (email, password) => {
    const response = await api.post('/auth/register', { email, password });
    await chrome.storage.local.set({ access_token: response.data.access_token });
    return response.data;
};

export const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    await chrome.storage.local.set({ access_token: response.data.access_token });
    return response.data;
};

export const getProfile = async () => {
    const response = await api.get('/v1/profile');
    return response.data;
};

export const updateProfile = async (profileData) => {
    const response = await api.put('/v1/profile', profileData);
    return response.data;
};

export const getApplications = async () => {
    const response = await api.get('/v1/applications');
    return response.data;
};

export const updateApplicationStatus = async (id, status) => {
    const response = await api.put(`/v1/applications/${id}/status`, { status });
    return response.data;
};

export const deleteApplication = async (id) => {
    const response = await api.delete(`/v1/applications/${id}`);
    return response.data;
};

export const logout = async () => {
    await chrome.storage.local.remove(['access_token']);
};

export default api;
