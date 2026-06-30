import { useState, useEffect } from 'react';

const API_BASE_URL = (import.meta.env.VITE_BACKEND_URL as string) || 'http://localhost:3000';

export interface ConfigPanelState {
  configs: Record<string, string>;
  loading: boolean;
  error: string | null;
  updating: Set<string>;
  saved: Set<string>;
  updateConfig: (key: string, value: string) => Promise<void>;
}

export function useConfigPanel(): ConfigPanelState {
  const [configs, setConfigs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/config`)
      .then((r) => r.json())
      .then((data) => setConfigs(data.configs ?? {}))
      .catch(() => setError('Error al cargar configuraciones'))
      .finally(() => setLoading(false));
  }, []);

  async function updateConfig(key: string, value: string) {
    setUpdating((prev) => new Set(prev).add(key));
    try {
      const res = await fetch(`${API_BASE_URL}/api/config/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Error al actualizar');
      }
      setConfigs((prev) => ({ ...prev, [key]: value }));
      setSaved((prev) => {
        const next = new Set(prev).add(key);
        setTimeout(
          () => setSaved((s) => { const n = new Set(s); n.delete(key); return n; }),
          2000
        );
        return next;
      });
    } finally {
      setUpdating((prev) => { const n = new Set(prev); n.delete(key); return n; });
    }
  }

  return { configs, loading, error, updating, saved, updateConfig };
}
