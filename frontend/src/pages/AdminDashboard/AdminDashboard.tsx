import React, { useState } from 'react';
import { useDashboardStream, useOnboardingHistory } from './useAdminDashboard';
import { OnboardingRecord } from '../../types/analytics.types';
import { ShieldCheck, RefreshCw, AlertTriangle, Clock, Loader2, Zap } from 'lucide-react';
import { formatAge, formatName, STATUS_STYLES, STEP_LABELS } from './utilsAdminDashboard';
import { OnboardingInspector } from './OnboardingInspector';

const QueueTable: React.FC<{
  rows: OnboardingRecord[];
  emptyMessage?: string;
  onRowClick?: (id: string) => void;
}> = ({ rows, emptyMessage = 'Sin registros', onRowClick }) => {
  const thStyle: React.CSSProperties = {
    padding: '0.65rem 1rem',
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

  return (
    <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '680px' }}>
        <thead style={{ backgroundColor: '#f9fafb' }}>
          <tr>
            <th style={thStyle}>ID</th>
            <th style={thStyle}>ESTADO</th>
            <th style={thStyle}>AVANCE</th>
            <th style={thStyle}>ETAPA ACTUAL</th>
            <th style={thStyle}>ANTIGÜEDAD</th>
            <th style={thStyle}>INTENTOS</th>
            <th style={thStyle}>MODO</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                style={{ ...tdStyle, textAlign: 'center', color: '#9ca3af', padding: '2rem' }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const statusStyle = STATUS_STYLES[row.status] ?? {
                bg: '#f3f4f6',
                color: '#374151',
                label: row.status,
              };
              const pct = Math.round((row.currentStep / 8) * 100);

              return (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row.id)}
                  style={{ backgroundColor: 'white', cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {/* ID */}
                  <td style={tdStyle}>
                    <span
                      title={row.id}
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        color: '#374151',
                        cursor: 'default',
                      }}
                    >
                      {row.id.slice(0, 8)}…
                    </span>
                  </td>

                  {/* Estado */}
                  <td style={tdStyle}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: '0.2rem 0.65rem',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.color,
                      }}
                    >
                      {row.status === 'PROCESSING' && (
                        <Loader2
                          style={{
                            width: '10px',
                            height: '10px',
                            animation: 'spin 1s linear infinite',
                          }}
                        />
                      )}
                      {statusStyle.label}
                    </span>
                  </td>

                  {/* Avance */}
                  <td style={{ ...tdStyle, minWidth: '120px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div
                        style={{
                          flex: 1,
                          height: '6px',
                          backgroundColor: '#e5e7eb',
                          borderRadius: '3px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            backgroundColor: row.status === 'FAILED' ? '#ef4444' : '#3b82f6',
                            borderRadius: '3px',
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.78rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
                        {row.currentStep} / 8
                      </span>
                    </div>
                  </td>

                  {/* Etapa */}
                  <td style={{ ...tdStyle, color: '#374151' }}>
                    {STEP_LABELS[row.currentStep] ?? `Paso ${row.currentStep}`}
                  </td>

                  {/* Antigüedad */}
                  <td style={{ ...tdStyle, color: '#6b7280', whiteSpace: 'nowrap' }}>
                    {formatAge(row.createdAt)}
                  </td>

                  {/* Intentos */}
                  <td style={tdStyle}>
                    {row.attempts > 0 ? (
                      <span
                        style={{
                          padding: '0.15rem 0.5rem',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: '#fee2e2',
                          color: '#991b1b',
                        }}
                      >
                        {row.attempts}
                      </span>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>—</span>
                    )}
                  </td>

                  {/* Modo */}
                  <td style={tdStyle}>
                    <span
                      style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: row.config?.isManual ? '#dbeafe' : '#f3f4f6',
                        color: row.config?.isManual ? '#1e40af' : '#6b7280',
                      }}
                    >
                      {row.config?.isManual ? 'Manual' : 'Auto'}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export const AdminDashboard: React.FC = () => {
  const { metrics, connected, error, handleStressTest, isSeedPending, isSeedSuccess, seedMessage } =
    useDashboardStream();
  const [tableView, setTableView] = useState<'active' | 'history'>('active');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: historyRows = [], isLoading: historyLoading } = useOnboardingHistory();

  return (
    <div
      style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid #eee',
          paddingBottom: '1rem',
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Centro de Control Operativo</h1>
          <p style={{ color: '#666', margin: '5px 0 0 0' }}>
            Monitoreo analítico del motor de onboarding en tiempo real
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            backgroundColor: connected ? '#e6f4ea' : '#fce8e6',
            color: connected ? '#137333' : '#c5221f',
          }}
        >
          <RefreshCw
            className={connected ? 'animate-spin' : ''}
            style={{ width: '16px', height: '16px' }}
          />
          <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
            {connected ? 'STREAM ACTIVO' : 'DESCONECTADO'}
          </span>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#fce8e6',
            color: '#c5221f',
            borderRadius: '5px',
            marginTop: '1rem',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Tabla principal con toggle */}
      <div style={{ marginTop: '2rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>
              {tableView === 'active' ? 'Cola activa' : 'Historial'}
            </h2>
            <span
              style={{
                padding: '0.1rem 0.6rem',
                borderRadius: '999px',
                backgroundColor: tableView === 'active' ? '#dbeafe' : '#dcfce7',
                color: tableView === 'active' ? '#1e40af' : '#166534',
                fontSize: '0.8rem',
                fontWeight: 700,
              }}
            >
              {tableView === 'active' ? (metrics?.activeCount ?? '…') : historyRows.length}
            </span>
            {tableView === 'active' && (
              <p
                style={{
                  color: 'GrayText',
                  fontSize: '0.8rem',
                }}
              >
                Viendo los primeros 100
              </p>
            )}

            {tableView === 'active' && (
              <div
                style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}
              >
                <button
                  onClick={handleStressTest}
                  disabled={isSeedPending}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.25rem',
                    backgroundColor: '#e01e5a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(224,30,90,0.2)',
                    width: 'auto',
                  }}
                >
                  <Zap style={{ fill: 'white', width: '16px' }} />
                  {isSeedPending ? 'Inyectando Carga...' : 'Simular Carga Masiva (100 Onboardings)'}
                </button>

                {isSeedSuccess && (
                  <span style={{ color: '#137333', fontSize: '0.9rem', fontWeight: 'bold' }}>
                    ✅ {seedMessage}
                  </span>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {(['active', 'history'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setTableView(view)}
                style={{
                  padding: '0.35rem 0.9rem',
                  borderRadius: '999px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  backgroundColor: tableView === view ? '#0070f3' : '#f3f4f6',
                  color: tableView === view ? '#fff' : '#6b7280',
                  transition: 'background-color 0.15s',
                }}
              >
                {view === 'active' ? 'Cola activa' : 'Historial'}
              </button>
            ))}
          </div>
        </div>
        {tableView === 'history' && historyLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
            Cargando historial…
          </div>
        ) : (
          <QueueTable
            rows={tableView === 'active' ? (metrics?.activeOnboardings ?? []) : historyRows}
            emptyMessage={
              tableView === 'active'
                ? 'Sin registros activos en la cola'
                : 'Sin registros históricos'
            }
            onRowClick={setSelectedId}
          />
        )}
      </div>

      {/* Inspector de detalle (modal) */}
      {selectedId && (
        <OnboardingInspector onboardingId={selectedId} onClose={() => setSelectedId(null)} />
      )}

      {/* Paneles analíticos */}
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}
      >
        {/* Funnel */}
        <div style={{ border: '1px solid #eee', padding: '1.5rem', borderRadius: '8px' }}>
          <h3
            style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <ShieldCheck style={{ color: '#137333' }} /> Funnel de Pasos Completados
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {metrics?.funnel.map((item) => (
              <div key={item.step_name}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.85rem',
                    marginBottom: '4px',
                  }}
                >
                  <strong>{formatName(item.step_name)}</strong>
                  <span>{item.count} usuarios</span>
                </div>
                <div
                  style={{
                    width: '100%',
                    backgroundColor: '#eee',
                    borderRadius: '4px',
                    height: '12px',
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(item.count * 10, 100)}%`,
                      backgroundColor: '#137333',
                      borderRadius: '4px',
                      height: '100%',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
              </div>
            ))}
            {(!metrics || metrics.funnel.length === 0) && (
              <p style={{ color: '#888' }}>Esperando transacciones vivas...</p>
            )}
          </div>
        </div>

        {/* Error rates */}
        <div style={{ border: '1px solid #eee', padding: '1.5rem', borderRadius: '8px' }}>
          <h3
            style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <AlertTriangle style={{ color: '#d93025' }} /> Historial de Frecuencia de Fallos (%)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {metrics?.errorRates.map((item) => (
              <div key={item.step_name}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.85rem',
                    marginBottom: '4px',
                  }}
                >
                  <strong>{formatName(item.step_name)}</strong>
                  <span
                    style={{
                      color: item.error_rate_pct > 30 ? '#d93025' : '#666',
                      fontWeight: 'bold',
                    }}
                  >
                    {item.error_rate_pct}%
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    backgroundColor: '#eee',
                    borderRadius: '4px',
                    height: '12px',
                  }}
                >
                  <div
                    style={{
                      width: `${item.error_rate_pct}%`,
                      backgroundColor: '#d93025',
                      borderRadius: '4px',
                      height: '100%',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
              </div>
            ))}
            {(!metrics || metrics.errorRates.length === 0) && (
              <p style={{ color: '#888' }}>Sin alertas de errores registradas.</p>
            )}
          </div>
        </div>
      </div>

      {/* Tiempos promedio */}
      <div
        style={{
          marginTop: '2rem',
          border: '1px solid #eee',
          padding: '1.5rem',
          borderRadius: '8px',
        }}
      >
        <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock style={{ color: '#f4b400' }} /> Rendimiento y Latencia Promedio por Proveedor
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem' }}>
          <thead>
            <tr
              style={{
                textAlign: 'left',
                borderBottom: '2px solid #eee',
                color: '#666',
                fontSize: '0.9rem',
              }}
            >
              <th style={{ padding: '0.75rem' }}>PASO OPERATIVO</th>
              <th style={{ padding: '0.75rem' }}>TIEMPO PROMEDIO (MS)</th>
              <th style={{ padding: '0.75rem' }}>ESTADO ACORDADO (SLA)</th>
            </tr>
          </thead>
          <tbody>
            {metrics?.averageTimes.map((item) => (
              <tr
                key={item.step_name}
                style={{ borderBottom: '1px solid #eee', fontSize: '0.9rem' }}
              >
                <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>
                  {formatName(item.step_name)}
                </td>
                <td style={{ padding: '0.75rem', color: '#0070f3', fontWeight: 'bold' }}>
                  {item.avg_duration_ms} ms
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: item.avg_duration_ms > 2000 ? '#fef7e0' : '#e6f4ea',
                      color: item.avg_duration_ms > 2000 ? '#b06000' : '#137333',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                    }}
                  >
                    {item.avg_duration_ms > 2000 ? 'LATENCIA ALTA' : 'ÓPTIMO'}
                  </span>
                </td>
              </tr>
            ))}
            {(!metrics || metrics.averageTimes.length === 0) && (
              <tr>
                <td colSpan={3} style={{ padding: '1rem', textAlign: 'center', color: '#888' }}>
                  Esperando consolidación de métricas en Neon...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
