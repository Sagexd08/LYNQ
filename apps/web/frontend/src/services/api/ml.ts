import apiClient from './client';

export const mlApi = {
    getMyCreditScore: () => apiClient.get('/ml/my-score'),
    getFeatureImportance: () => apiClient.get('/ml/feature-importance'),
    getAnomalyBaseline: () => apiClient.get('/ml/anomaly-baseline'),
};
