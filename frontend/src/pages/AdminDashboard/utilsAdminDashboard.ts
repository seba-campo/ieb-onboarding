export function formatAge(createdAt: string): string {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const secs = Math.floor(diffMs / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export const formatName = (name: string) => name.replace('_', ' ').toUpperCase();

export const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  PENDING: { bg: '#fef3c7', color: '#92400e', label: 'En cola' },
  PROCESSING: { bg: '#dbeafe', color: '#1e40af', label: 'Procesando' },
  FAILED: { bg: '#fee2e2', color: '#991b1b', label: 'Fallido' },
  PAUSED: { bg: '#ffedd5', color: '#9a3412', label: 'En pausa' },
  COMPLETED: { bg: '#dcfce7', color: '#166534', label: 'Completado' },
  CANCELLED: { bg: '#f3f4f6', color: '#6b7280', label: 'Cancelado' },
};

export const STEP_LABELS: Record<number, string> = {
  1: 'Verificación de identidad',
  2: 'Confirmación de email',
  3: 'Verificación de teléfono',
  4: 'Carga de documentación',
  5: 'Control de selfie',
  6: 'Scoring de riesgo',
  7: 'Creación de cuenta',
  8: 'Kit de bienvenida',
};
