import { useState, useEffect, useCallback } from 'react';
import { intelligenceApi } from '@/lib/api/intelligence';
import { IntelligenceData } from '@/lib/api/types';

export function useIntelligence() {
    const [data, setData] = useState<IntelligenceData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchIntelligence = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const intelligenceData = await intelligenceApi.getIntelligenceData();
            setData(intelligenceData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch intelligence data');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchIntelligence();
        const interval = setInterval(fetchIntelligence, 120000);
        return () => clearInterval(interval);
    }, [fetchIntelligence]);

    return {
        data,
        isLoading,
        error,
        refresh: fetchIntelligence,
    };
}

export function usePredictions() {
    const [predictions, setPredictions] = useState<IntelligenceData['predictions']>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPredictions = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await intelligenceApi.getPredictions();
            setPredictions(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch predictions');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPredictions();
    }, [fetchPredictions]);

    return { predictions, isLoading, error, refresh: fetchPredictions };
}

export function useInsights() {
    const [insights, setInsights] = useState<IntelligenceData['insights']>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchInsights = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await intelligenceApi.getInsights();
            setInsights(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch insights');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInsights();
    }, [fetchInsights]);

    return { insights, isLoading, error, refresh: fetchInsights };
}

export function useRiskForecasts() {
    const [forecasts, setForecasts] = useState<IntelligenceData['riskForecasts']>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchForecasts = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await intelligenceApi.getRiskForecasts();
            setForecasts(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch risk forecasts');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchForecasts();
    }, [fetchForecasts]);

    return { forecasts, isLoading, error, refresh: fetchForecasts };
}

export function useModelInfo() {
    const [modelInfo, setModelInfo] = useState<{
        version: string;
        lastUpdated: string;
        accuracy: number;
        dataPoints: number;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchModelInfo = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await intelligenceApi.getModelInfo();
            setModelInfo(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch model info');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchModelInfo();
    }, [fetchModelInfo]);

    return { modelInfo, isLoading, error, refresh: fetchModelInfo };
}
