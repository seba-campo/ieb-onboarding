import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { onboardingService } from '../../api/onboarding';
import { Pause, Play, XCircle } from 'lucide-react';

interface InspectorProps {
  onboardingId: string;
  onClose: () => void;
}

export const OnboardingInspector: React.FC<InspectorProps> = ({ onboardingId, onClose }) => {
  const queryClient = useQueryClient();
  const queryKey = ['onboarding-detail', onboardingId];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => onboardingService.getStatus(onboardingId),
    refetchInterval: 3000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const pauseMutation  = useMutation({ mutationFn: () => onboardingService.pause(onboardingId),  onSuccess: invalidate });
  const resumeMutation = useMutation({ mutationFn: () => onboardingService.resume(onboardingId), onSuccess: invalidate });
  const cancelMutation = useMutation({ mutationFn: () => onboardingService.cancel(onboardingId), onSuccess: invalidate });

  const isActioning = pauseMutation.isPending || resumeMutation.isPending || cancelMutation.isPending;

  const btnBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 14px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.82rem',
    fontWeight: 600,
    opacity: isActioning ? 0.6 : 1,
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.45)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: '100%',
        maxWidth: '680px',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #d1d5db',
        borderRadius: '10px',
        backgroundColor: '#fff',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.9rem 1.25rem',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111827' }}>
            Inspector de onboarding
          </span>
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: '0.78rem',
              color: '#6b7280',
              backgroundColor: '#e5e7eb',
              padding: '1px 6px',
              borderRadius: '4px',
            }}
          >
            {onboardingId.slice(0, 8)}…
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#6b7280',
            fontSize: '0.85rem',
            padding: '4px 8px',
            borderRadius: '4px',
          }}
        >
          Cerrar ✕
        </button>
      </div>

      <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1 }}>
        {isLoading && (
          <p style={{ color: '#9ca3af', margin: 0 }}>Cargando datos desde Neon…</p>
        )}
        {(error || (!isLoading && !data)) && (
          <p style={{ color: '#ef4444', margin: 0 }}>⚠️ Error al cargar el onboarding</p>
        )}

        {data && (
          <>
            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              {(data.status === 'PENDING' || data.status === 'PROCESSING') && (
                <button
                  disabled={isActioning}
                  onClick={() => pauseMutation.mutate()}
                  style={{ ...btnBase, backgroundColor: '#fef3c7', color: '#92400e' }}
                >
                  <Pause size={13} /> Pausar
                </button>
              )}

              {data.status === 'PAUSED' && (
                <button
                  disabled={isActioning}
                  onClick={() => resumeMutation.mutate()}
                  style={{ ...btnBase, backgroundColor: '#dcfce7', color: '#166534' }}
                >
                  <Play size={13} /> Reanudar
                </button>
              )}

              {data.status !== 'COMPLETED' && data.status !== 'CANCELLED' && (
                <button
                  disabled={isActioning}
                  onClick={() => cancelMutation.mutate()}
                  style={{ ...btnBase, backgroundColor: '#fee2e2', color: '#991b1b' }}
                >
                  <XCircle size={13} /> Cancelar
                </button>
              )}

              {(data.status === 'COMPLETED' || data.status === 'CANCELLED') && (
                <span style={{ fontSize: '0.82rem', color: '#9ca3af', alignSelf: 'center' }}>
                  Estado terminal — sin acciones disponibles
                </span>
              )}
            </div>

            {/* JSON viewer */}
            <div>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#6b7280',
                  letterSpacing: '0.05em',
                  display: 'block',
                  marginBottom: '0.5rem',
                }}
              >
                PAYLOAD COMPLETO
              </span>
              <pre
                style={{
                  backgroundColor: '#1e1e1e',
                  color: '#9cdcfe',
                  padding: '1rem 1.25rem',
                  borderRadius: '8px',
                  overflowX: 'auto',
                  fontSize: '0.82rem',
                  margin: 0,
                  fontFamily: '"Cascadia Code", "Fira Code", monospace',
                  lineHeight: '1.55',
                }}
              >
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          </>
        )}
      </div>
    </div>
    </div>
  );
};
