import React, { useState } from 'react';
import { useDashboardStream, useOnboardingHistory } from './useAdminDashboard';
import { OnboardingRecord } from '../../types/analytics.types';
import { ShieldCheck, RefreshCw, AlertTriangle, Clock, Loader2, Zap, Settings } from 'lucide-react';
import { ConfigPanel } from './ConfigPanel/ConfigPanel';
import { formatAge, formatDate, formatName, STATUS_STYLES, STEP_LABELS } from './utilsAdminDashboard';
import { OnboardingInspector } from './OnboardingInspector';
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip,
  ReferenceLine, Cell,
} from 'recharts';

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
            <th style={thStyle}>FECHA CREACIÓN</th>
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

                  {/* Fecha creación */}
                  <td
                    title={`Hace ${formatAge(row.createdAt)}`}
                    style={{ ...tdStyle, color: '#374151', whiteSpace: 'nowrap', fontSize: '0.82rem', fontFamily: 'monospace' }}
                  >
                    {formatDate(row.createdAt)}
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

const FUNNEL_COLORS = [
  '#4338ca', '#2563eb', '#0284c7', '#06b6d4',
  '#10b981', '#16a34a', '#15803d', '#166534',
];

const STEP_SHORT: Record<string, string> = {
  identity_verification: 'Identidad',
  email_confirmation:    'Email OTP',
  phone_verification:    'SMS OTP',
  document_upload:       'Documentos',
  selfie_check:          'Biometría',
  risk_scoring:          'Riesgo',
  account_creation:      'Cuenta CVU',
  welcome_kit:           'Bienvenida',
};

export const AdminDashboard: React.FC = () => {
  const { metrics, connected, error, handleStressTest, isSeedPending, isSeedSuccess, seedMessage } =
    useDashboardStream();
  const [tableView, setTableView] = useState<'active' | 'history'>('active');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');
  const [order, setOrder]       = useState<'ASC' | 'DESC'>('DESC');
  const { data: historyRows = [], isLoading: historyLoading } = useOnboardingHistory({ dateFrom, dateTo, order });

  const funnelData = (metrics?.funnel ?? []).map((item, idx) => ({
    name: STEP_SHORT[item.step_name] ?? formatName(item.step_name),
    paso: `P${idx + 1}`,
    value: Number(item.count),
    fill: FUNNEL_COLORS[idx % FUNNEL_COLORS.length],
  }));

  const errorData = (metrics?.errorRates ?? []).map((item) => ({
    name: STEP_SHORT[item.step_name] ?? formatName(item.step_name),
    pct: Number(item.error_rate_pct),
  }));

  const timesData = (metrics?.averageTimes ?? []).map((item) => ({
    name: STEP_SHORT[item.step_name] ?? formatName(item.step_name),
    ms: item.avg_duration_ms,
  }));

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setConfigOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              border: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb',
              color: '#374151',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            <Settings style={{ width: '15px', height: '15px' }} />
            Configuraciones
          </button>
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Filtros de fecha — solo visibles en historial */}
            {tableView === 'history' && (
              <>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  style={{
                    padding: '0.3rem 0.6rem',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                    fontSize: '0.8rem',
                    color: '#374151',
                  }}
                />
                <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>—</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  style={{
                    padding: '0.3rem 0.6rem',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                    fontSize: '0.8rem',
                    color: '#374151',
                  }}
                />
                <button
                  onClick={() => setOrder((o) => (o === 'DESC' ? 'ASC' : 'DESC'))}
                  title={`Orden actual: ${order}`}
                  style={{
                    padding: '0.3rem 0.7rem',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                    backgroundColor: '#f9fafb',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#374151',
                  }}
                >
                  {order === 'DESC' ? '↓ Más reciente' : '↑ Más antiguo'}
                </button>
                {(dateFrom || dateTo) && (
                  <button
                    onClick={() => { setDateFrom(''); setDateTo(''); }}
                    style={{
                      padding: '0.3rem 0.7rem',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb',
                      backgroundColor: '#f9fafb',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      color: '#6b7280',
                    }}
                  >
                    Limpiar
                  </button>
                )}
              </>
            )}
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
        <div style={{ border: '1px solid #e5e7eb', padding: '1.5rem', borderRadius: '8px' }}>
          <h3
            style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}
          >
            <ShieldCheck style={{ color: '#137333', width: 18, height: 18 }} /> Funnel de Pasos Completados
          </h3>
          {funnelData.length > 0 ? (
            <ResponsiveContainer width="100%" height={270}>
              <BarChart data={funnelData} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="paso" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                  width={44}
                  tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}
                />
                <ChartTooltip
                  formatter={(v: number) => [`${v} completados`]}
                  labelFormatter={(_l: string, payload: { payload?: { name?: string } }[]) =>
                    payload?.[0]?.payload?.name ?? _l
                  }
                  contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={44}>
                  {funnelData.map((_, idx) => (
                    <Cell key={idx} fill={FUNNEL_COLORS[idx % FUNNEL_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: '#9ca3af', fontSize: '0.85rem', paddingTop: '0.5rem' }}>Esperando transacciones vivas...</p>
          )}
        </div>

        {/* Error rates */}
        <div style={{ border: '1px solid #e5e7eb', padding: '1.5rem', borderRadius: '8px' }}>
          <h3
            style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}
          >
            <AlertTriangle style={{ color: '#d93025', width: 18, height: 18 }} /> Tasa de Fallos por Paso (%)
          </h3>
          {errorData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={errorData} layout="vertical" margin={{ top: 4, right: 28, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: '#374151' }} tickLine={false} axisLine={false} />
                <ChartTooltip
                  formatter={(v: number) => [`${v.toFixed(1)}%`, 'Tasa de error']}
                  contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e5e7eb' }}
                />
                <ReferenceLine
                  x={30}
                  stroke="#d93025"
                  strokeDasharray="5 3"
                  label={{ value: 'Umbral 30%', position: 'insideTopRight', fill: '#d93025', fontSize: 10 }}
                />
                <Bar dataKey="pct" radius={[0, 4, 4, 0]} maxBarSize={18}>
                  {errorData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.pct > 30 ? '#ef4444' : '#22c55e'} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: '#9ca3af', fontSize: '0.85rem', paddingTop: '0.5rem' }}>Sin datos de error registrados.</p>
          )}
        </div>
      </div>

      {/* Tiempos promedio */}
      <div
        style={{ marginTop: '2rem', border: '1px solid #e5e7eb', padding: '1.5rem', borderRadius: '8px' }}
      >
        <h3
          style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}
        >
          <Clock style={{ color: '#f59e0b', width: 18, height: 18 }} /> Latencia Promedio por Paso
          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 400, color: '#f59e0b' }}>
            — SLA: 2000 ms
          </span>
        </h3>
        {timesData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={timesData} layout="vertical" margin={{ top: 4, right: 28, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
              <XAxis type="number" unit=" ms" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: '#374151' }} tickLine={false} axisLine={false} />
              <ChartTooltip
                formatter={(v: number) => [`${v} ms`, 'Latencia promedio']}
                contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e5e7eb' }}
              />
              <ReferenceLine
                x={2000}
                stroke="#f59e0b"
                strokeDasharray="5 3"
                label={{ value: 'SLA 2000ms', position: 'insideTopRight', fill: '#f59e0b', fontSize: 10 }}
              />
              <Bar dataKey="ms" radius={[0, 4, 4, 0]} maxBarSize={18}>
                {timesData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.ms >= 2000 ? '#f59e0b' : '#3b82f6'} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ color: '#9ca3af', fontSize: '0.85rem', paddingTop: '0.5rem' }}>Esperando consolidación de métricas en Neon...</p>
        )}
      </div>

      {/* Modal de configuración */}
      {configOpen && (
        <div
          onClick={() => setConfigOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '2rem',
              width: '100%',
              maxWidth: '780px',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
              }}
            >
              <h2
                style={{
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '1.1rem',
                }}
              >
                <Settings style={{ width: '18px', color: '#6b7280' }} />
                Configuración de Umbrales de Alerta
              </h2>

              <button
                onClick={() => setConfigOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.4rem',
                  cursor: 'pointer',
                  color: '#9ca3af',
                  lineHeight: 1,
                  padding: '0 0.25rem',
                }}
              >
                ×
              </button>
            </div>
            <div>
              <p
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '0.9rem',
                  color: '#9ca3af',
                  lineHeight: 1,
                }}
              >
                Alertas enviadas al canal #alerts
              </p>
            </div>
            <ConfigPanel />
          </div>
        </div>
      )}
    </div>
  );
};
