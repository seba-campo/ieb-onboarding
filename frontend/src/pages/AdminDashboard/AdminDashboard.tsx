import React from 'react';
import { useDashboardStream } from './useAdminDashboard';
import { ShieldCheck, RefreshCw, AlertTriangle, Clock } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { metrics, connected, error } = useDashboardStream();

  const formatName = (name: string) => name.replace('_', ' ').toUpperCase();

  return (
    <div
      style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}
    >
      {/* Header Operativo */}
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

      {/* Tarjeta de Carga Activa */}
      <div
        style={{
          marginTop: '2rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
        }}
      >
        <div
          style={{
            padding: '1.5rem',
            border: '1px solid #eee',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          }}
        >
          <span style={{ color: '#666', fontSize: '0.9rem', fontWeight: 'bold' }}>
            USUARIOS EN COLA ACTIVA
          </span>
          <h2 style={{ fontSize: '2.5rem', margin: '0.5rem 0 0 0', color: '#0070f3' }}>
            {metrics ? metrics.activeCount : '...'}
          </h2>
        </div>
      </div>

      {/* Paneles Analíticos */}
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}
      >
        {/* 1. FUNNEL DE CONVERSIÓN */}
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

        {/* 2. TASAS DE ERROR */}
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

      {/* 3. TIEMPOS PROMEDIO DE RESPUESTA */}
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
