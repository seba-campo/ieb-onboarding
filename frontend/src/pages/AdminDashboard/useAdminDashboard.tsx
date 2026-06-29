import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardMetrics, OnboardingRecord } from '../../types/analytics.types';

const API_BASE_URL = (import.meta.env.VITE_BACKEND_URL as string) || 'http://localhost:3000';

export const useDashboardStream = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Abrir la conexión HTTP persistente hacia el endpoint SSE del backend
    const eventSource = new EventSource(`${API_BASE_URL}/api/dashboard/stream`);

    eventSource.onopen = () => {
      setConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.connected) return; // Ignorar el ping inicial de conexión

        setMetrics(data as DashboardMetrics);
      } catch (err) {
        console.error('Error parseando JSON de SSE:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('Error en canal SSE:', err);
      setError('Conexión interrumpida con el servidor de métricas.');
      setConnected(false);
      eventSource.close();
    };

    // Cleanup: Si el admin cambia de ruta, cerramos el stream inmediatamente
    return () => {
      eventSource.close();
    };
  }, []);

  return { metrics, connected, error };
};

export const useOnboardingHistory = () => {
  return useQuery<OnboardingRecord[]>({
    queryKey: ['onboarding-history'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/onboardings?limit=50`);
      if (!res.ok) throw new Error('Failed to fetch history');
      return res.json();
    },
    refetchInterval: 15_000,
  });
};
