import api from './client';
import { IntelligenceData } from './types';

export const intelligenceApi = {
    async getIntelligenceData(): Promise<IntelligenceData> {
        try {
            const response = await api.get<IntelligenceData>('/intelligence');
            return response.data;
        } catch {
            return this.getDefaultIntelligenceData();
        }
    },

    getDefaultIntelligenceData(): IntelligenceData {
        return {
            predictions: [],
            insights: [],
            riskForecasts: [],
        };
    },

    async getPredictions(): Promise<IntelligenceData['predictions']> {
        const data = await this.getIntelligenceData();
        return data.predictions;
    },

    async getInsights(): Promise<IntelligenceData['insights']> {
        const data = await this.getIntelligenceData();
        return data.insights;
    },

    async getRiskForecasts(): Promise<IntelligenceData['riskForecasts']> {
        const data = await this.getIntelligenceData();
        return data.riskForecasts;
    },

    async getModelInfo(): Promise<{
        version: string;
        lastUpdated: string;
        accuracy: number;
        dataPoints: number;
    }> {
        return {
            version: 'N/A',
            lastUpdated: new Date().toISOString(),
            accuracy: 0,
            dataPoints: 0,
        };
    },
};
