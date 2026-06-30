import React, { useState, useEffect } from 'react';
import { Loader2, Check } from 'lucide-react';
import { useConfigPanel } from './useConfigPanel';

interface ConfigRow {
  key: string;
  label: string;
  description: string;
}

const CONFIG_ROWS: ConfigRow[] = [
  {
    key: 'LOW_CONVERSION_RATE',
    label: 'Tasa mínima de conversión',
    description: 'Alerta si la tasa global cae por debajo (ej: 0.7 = 70%)',
  },
  {
    key: 'HIGH_STEP_ERROR_RATE_PCT',
    label: '% máximo de fallo por paso',
    description: 'Alerta si un paso supera este % de errores en la última hora',
  },
  {
    key: 'STUCK_MIN_COUNT',
    label: 'Onboardings estancados (mínimo)',
    description: 'Cantidad mínima de onboardings bloqueados > 30 min para alertar',
  },
  {
    key: 'ERROR_SPIKE_COUNT',
    label: 'Umbral de spike de errores',
    description: 'FAILs en 5 min que disparan la alerta de degradación',
  },
  {
    key: 'COOLDOWN_MS',
    label: 'Cooldown entre alertas (ms)',
    description: 'Silencio en milisegundos entre alertas del mismo tipo',
  },
  {
    key: 'CONVERSION_MIN_SAMPLE',
    label: 'Muestra mínima (conversión)',
    description: 'Mínimo de onboardings procesados para evaluar la tasa de conversión',
  },
];

const thStyle: React.CSSProperties = {
  padding: '0.6rem 1rem',
  textAlign: 'left',
  fontSize: '0.75rem',
  fontWeight: 700,
  color: '#6b7280',
  letterSpacing: '0.05em',
  borderBottom: '2px solid #e5e7eb',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  fontSize: '0.875rem',
  borderBottom: '1px solid #f3f4f6',
  verticalAlign: 'middle',
};

function ConfigRowEditor({
  row,
  currentValue,
  updating,
  saved,
  onSave,
}: {
  row: ConfigRow;
  currentValue: string;
  updating: boolean;
  saved: boolean;
  onSave: (value: string) => void;
}) {
  const [draft, setDraft] = useState(currentValue);

  // Sync draft when server value changes (e.g. initial load)
  useEffect(() => {
    setDraft(currentValue);
  }, [currentValue]);

  const isDirty = draft !== currentValue;

  return (
    <tr style={{ backgroundColor: 'white' }}>
      <td style={tdStyle}>
        <div style={{ fontWeight: 600, color: '#111827' }}>{row.label}</div>
        <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '2px' }}>
          {row.description}
        </div>
      </td>
      <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '0.8rem', color: '#6b7280' }}>
        {row.key}
      </td>
      <td style={{ ...tdStyle, width: '160px' }}>
        <input
          type="number"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          style={{
            width: '100%',
            padding: '0.35rem 0.6rem',
            borderRadius: '6px',
            border: `1px solid ${isDirty ? '#3b82f6' : '#e5e7eb'}`,
            fontSize: '0.875rem',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </td>
      <td style={{ ...tdStyle, width: '100px', textAlign: 'center' }}>
        {saved ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              color: '#16a34a',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            <Check style={{ width: '14px', height: '14px' }} /> Guardado
          </span>
        ) : (
          <button
            onClick={() => onSave(draft)}
            disabled={updating || !isDirty}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              border: 'none',
              cursor: updating || !isDirty ? 'not-allowed' : 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
              backgroundColor: !isDirty ? '#f3f4f6' : '#3b82f6',
              color: !isDirty ? '#9ca3af' : '#ffffff',
              transition: 'background-color 0.15s',
            }}
          >
            {updating && <Loader2 style={{ width: '12px', height: '12px', animation: 'spin 1s linear infinite' }} />}
            {updating ? 'Guardando…' : 'Guardar'}
          </button>
        )}
      </td>
    </tr>
  );
}

export const ConfigPanel: React.FC = () => {
  const { configs, loading, error, updating, saved, updateConfig } = useConfigPanel();

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
        <Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '1rem', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '6px', fontSize: '0.875rem' }}>
        ⚠️ {error}
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '620px' }}>
        <thead style={{ backgroundColor: '#f9fafb' }}>
          <tr>
            <th style={thStyle}>UMBRAL</th>
            <th style={thStyle}>CLAVE</th>
            <th style={thStyle}>VALOR ACTUAL</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>ACCIÓN</th>
          </tr>
        </thead>
        <tbody>
          {CONFIG_ROWS.map((row) => (
            <ConfigRowEditor
              key={row.key}
              row={row}
              currentValue={configs[row.key] ?? ''}
              updating={updating.has(row.key)}
              saved={saved.has(row.key)}
              onSave={(value) => updateConfig(row.key, value)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
