import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

// ─── Response Interceptor (Token Refresh) ────────────────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve(token)));
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const { data } = await axios.post(
                    `${API_URL}/auth/refresh-token`,
                    {},
                    { withCredentials: true }
                );
                const newToken = data.data.accessToken;
                localStorage.setItem('accessToken', newToken);
                api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
                processQueue(null, newToken);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                localStorage.removeItem('accessToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // Show error toast (except for 401 — handled above)
        const message = error.response?.data?.message || 'Something went wrong';
        if (error.response?.status !== 401 && error.response?.status !== 404) {
            toast.error(message);
        }

        return Promise.reject(error);
    }
);

export default api;

// ─── Auth Service ─────────────────────────────────────────────────────────────
export const authService = {
    register: (data) => api.post('/auth/register', data),
    verifyEmail: (data) => api.post('/auth/verify-email', data),
    resendOTP: (data) => api.post('/auth/resend-otp', data),
    login: (data) => api.post('/auth/login', data),
    logout: () => api.post('/auth/logout'),
    refreshToken: () => api.post('/auth/refresh-token'),
    forgotPassword: (data) => api.post('/auth/forgot-password', data),
    resetPassword: (token, data) => api.patch(`/auth/reset-password/${token}`, data),
    changePassword: (data) => api.patch('/auth/change-password', data),
    getMe: () => api.get('/auth/me'),
};

// ─── User Service ─────────────────────────────────────────────────────────────
export const userService = {
    getProfile: (id) => api.get(`/users/${id}`),
    updateProfile: (data) => api.patch('/users/profile', data),
    uploadAvatar: (formData) => api.patch('/users/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    getAllUsers: (params) => api.get('/users', { params }),
    getTrainers: (params) => api.get('/users/trainers', { params }),
    assignTrainer: (data) => api.post('/users/assign-trainer', data),
    toggleSaveWorkout: (workoutId) => api.patch(`/users/save-workout/${workoutId}`),
    getLeaderboard: (params) => api.get('/users/leaderboard', { params }),
    getNotifications: () => api.get('/users/notifications'),
    markNotificationsRead: () => api.patch('/users/notifications/read'),
    getAIRecommendation: () => api.get('/users/ai/recommend'),
    getAIDietPlan: () => api.get('/users/ai/diet'),
    fitnessChatAI: (data) => api.post('/users/ai/chat', data),
    analyzeWorkout: (data) => api.post('/users/ai/analyze-workout', data),
    getProgressPrediction: () => api.get('/users/ai/predict-progress'),
    deactivateUser: (id) => api.patch(`/users/${id}/deactivate`),
};

// ─── Workout Service ──────────────────────────────────────────────────────────
export const workoutService = {
    getWorkouts: (params) => api.get('/workouts', { params }),
    getWorkout: (id) => api.get(`/workouts/${id}`),
    createWorkout: (data) => api.post('/workouts', data),
    updateWorkout: (id, data) => api.patch(`/workouts/${id}`, data),
    deleteWorkout: (id) => api.delete(`/workouts/${id}`),
    rateWorkout: (id, data) => api.post(`/workouts/${id}/rate`, data),
    assignWorkout: (id, data) => api.post(`/workouts/${id}/assign`, data),
    getMyWorkouts: (params) => api.get('/workouts/my', { params }),
    getWeeklyPlan: (params) => api.get('/workouts/weekly-plan', { params }),
};

// ─── Exercise Service ─────────────────────────────────────────────────────────
export const exerciseService = {
    getExercises: (params) => api.get('/exercises', { params }),
    getExercise: (id) => api.get(`/exercises/${id}`),
    createExercise: (data) => api.post('/exercises', data),
    updateExercise: (id, data) => api.patch(`/exercises/${id}`, data),
    deleteExercise: (id) => api.delete(`/exercises/${id}`),
    getMuscleGroups: () => api.get('/exercises/muscle-groups'),
    uploadMedia: (id, formData) => api.post(`/exercises/${id}/media`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    approveExercise: (id) => api.patch(`/exercises/${id}/approve`),
};

// ─── Progress Service ─────────────────────────────────────────────────────────
export const progressService = {
    logProgress: (data) => api.post('/progress', data),
    getHistory: (params) => api.get('/progress/history', { params }),
    getSummary: (params) => api.get('/progress/summary', { params }),
    getPersonalRecords: () => api.get('/progress/records'),
    downloadReport: (params) => api.get('/progress/report/download', { params, responseType: 'blob' }),
    deleteEntry: (id) => api.delete(`/progress/${id}`),
};

// ─── Membership Service ───────────────────────────────────────────────────────
export const membershipService = {
    getPlans: () => api.get('/membership/plans'),
    getMyMembership: () => api.get('/membership/my'),
    initiatePayment: (data) => api.post('/membership/initiate-payment', data),
    verifyPayment: (data) => api.post('/membership/verify-payment', data),
    cancelMembership: (data) => api.patch('/membership/cancel', data),
    getPaymentHistory: (params) => api.get('/membership/payments', { params }),
    getAllMemberships: (params) => api.get('/membership/all', { params }),
    createPlan: (data) => api.post('/membership/plans', data),
    updatePlan: (id, data) => api.patch(`/membership/plans/${id}`, data),
};

// ─── Booking Service ──────────────────────────────────────────────────────────
export const bookingService = {
    getClasses: (params) => api.get('/booking/classes', { params }),
    createClass: (data) => api.post('/booking/classes', data),
    cancelClass: (id, data) => api.post(`/booking/classes/${id}/cancel`, data),
    createBooking: (data) => api.post('/booking', data),
    getMyBookings: (params) => api.get('/booking/my', { params }),
    cancelBooking: (id, data) => api.patch(`/booking/${id}/cancel`, data),
    confirmBooking: (id) => api.patch(`/booking/${id}/confirm`),
    submitFeedback: (id, data) => api.post(`/booking/${id}/feedback`, data),
    getTrainerSchedule: (params) => api.get('/booking/schedule', { params }),
};

// ─── Chat Service ─────────────────────────────────────────────────────────────
export const chatService = {
    getConversations: () => api.get('/chat/conversations'),
    getOrCreateConversation: (participantId) => api.get(`/chat/conversations/${participantId}/get-or-create`),
    getMessages: (conversationId, params) => api.get(`/chat/conversations/${conversationId}/messages`, { params }),
    sendMessage: (conversationId, data) => api.post(`/chat/conversations/${conversationId}/messages`, data),
    deleteMessage: (conversationId, messageId) => api.delete(`/chat/conversations/${conversationId}/messages/${messageId}`),
};

// ─── Analytics Service ────────────────────────────────────────────────────────
export const analyticsService = {
    getDashboardStats: () => api.get('/analytics/dashboard'),
    getRevenueChart: (params) => api.get('/analytics/revenue', { params }),
    getUserActivityChart: (params) => api.get('/analytics/users', { params }),
    getWorkoutAnalytics: () => api.get('/analytics/workouts'),
    getMemberProgress: () => api.get('/analytics/members'),
};