import apiClient from './client';

export const userApi = {
    getProfile: async () => {
        return apiClient.get('/users/me');
    },

    updateProfile: async (data: any) => {
        return apiClient.put('/users/me', data);
    }
};
