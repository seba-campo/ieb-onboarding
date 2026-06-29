import React, { useState } from 'react';
import { useOnboarding } from './useUserOnboarding';
import { CheckCircle2, XCircle, Loader2, Play, Circle, ChevronRight } from 'lucide-react';

const STEP_NAMES: string[] = [
  'identity_verification',
  'email_confirmation',
  'phone_verification',
  'document_upload',
  'selfie_check',
  'risk_scoring',
  'account_creation',
  'welcome_kit',
];

interface FieldOption {
  value: string;
  label: string;
}

interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'select';
  placeholder?: string;
  options?: Array<string | FieldOption>;
}

const STEP_FIELDS: Record<number, FieldConfig[]> = {
  1: [
    { name: 'firstName', label: 'Nombre', type: 'text', placeholder: 'Juan' },
    { name: 'lastName', label: 'Apellido', type: 'text', placeholder: 'Pérez' },
    { name: 'dni', label: 'DNI', type: 'text', placeholder: '20123456' },
    { name: 'gender', label: 'Género', type: 'select', options: ['M', 'F', 'X'] },
  ],
  2: [{ name: 'address', label: 'Correo electrónico', type: 'email', placeholder: 'juan@ejemplo.com' }],
  3: [
    { name: 'countryCode', label: 'Código de país', type: 'select', options: ['+54', '+1', '+34', '+598'] },
    { name: 'number', label: 'Número celular', type: 'tel', placeholder: '1145678901' },
  ],
  4: [
    {
      name: 'documentType',
      label: 'Tipo de documento',
      type: 'select',
      options: ['DNI', 'Pasaporte', 'LE', 'LC'],
    },
    { name: 'documentNumber', label: 'Número de documento', type: 'text', placeholder: '12345678' },
  ],
  5: [],
  6: [
    { name: 'monthlyIncome', label: 'Ingreso mensual (ARS)', type: 'text', placeholder: '150000' },
    {
      name: 'occupation',
      label: 'Ocupación',
      type: 'select',
      options: [
        'Empleado en relación de dependencia',
        'Monotributista',
        'Responsable inscripto',
        'Jubilado',
        'Otro',
      ],
    },
  ],
  7: [
    { name: 'alias', label: 'Alias CVU', type: 'text', placeholder: 'juan.perez.ieb' },
    {
      name: 'accountType',
      label: 'Tipo de cuenta',
      type: 'select',
      options: [
        { value: 'ARS_SAVINGS_ACCOUNT', label: 'Caja de ahorro ARS' },
        { value: 'ARS_CHECKING_ACCOUNT', label: 'Cuenta corriente ARS' },
        { value: 'USD_SAVINGS_ACCOUNT', label: 'Caja de ahorro USD' },
      ],
    },
  ],
  8: [
    {
      name: 'deliveryAddress',
      label: 'Dirección para envío del kit',
      type: 'text',
      placeholder: 'Av. Corrientes 1234, CABA',
    },
  ],
};

const STEP_PAYLOAD_KEY: Record<number, string> = {
  1: 'identity',
  2: 'email',
  3: 'phone',
  4: 'documents',
  5: 'biometrics',
  6: 'creditScoring',
  7: 'bankAccount',
  8: 'welcomeKit',
};

const STEP_TITLES: Record<number, string> = {
  1: 'Verificación de identidad',
  2: 'Confirmación de email',
  3: 'Verificación de teléfono',
  4: 'Carga de documentación',
  5: 'Control de selfie',
  6: 'Scoring de riesgo',
  7: 'Creación de cuenta',
  8: 'Kit de bienvenida',
};

interface StepFormProps {
  stepNumber: number;
  onSubmit: (payload: Record<string, string>) => void;
  isSubmitting: boolean;
}

const StepForm: React.FC<StepFormProps> = ({ stepNumber, onSubmit, isSubmitting }) => {
  const fields = STEP_FIELDS[stepNumber] ?? [];
  const [formData, setFormData] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      fields.map((f) => {
        const first = f.options?.[0];
        const defaultVal = first ? (typeof first === 'string' ? first : first.value) : '';
        return [f.name, defaultVal];
      })
    )
  );

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: 'white',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '0.25rem',
  };

  return (
    <form onSubmit={handleSubmit}>
      {fields.length === 0 ? (
        <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '1rem' }}>
          Confirmá que el control biométrico fue exitoso para continuar.
        </p>
      ) : (
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}
        >
          {fields.map((field) => (
            <div key={field.name}>
              <label style={labelStyle}>{field.label}</label>
              {field.type === 'select' ? (
                <select
                  value={formData[field.name]}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  style={inputStyle}
                >
                  {field.options?.map((opt) => {
                    const value = typeof opt === 'string' ? opt : opt.value;
                    const label = typeof opt === 'string' ? opt : opt.label;
                    return (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <input
                  type={field.type}
                  value={formData[field.name]}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  required
                  style={inputStyle}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.6rem 1.25rem',
          backgroundColor: isSubmitting ? '#93c5fd' : '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '0.9rem',
          fontWeight: 600,
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
        }}
      >
        {isSubmitting ? (
          <Loader2 className="animate-spin w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
        {isSubmitting ? 'Enviando...' : 'Confirmar y avanzar'}
      </button>
    </form>
  );
};

export const UserOnboarding: React.FC = () => {
  const {
    onboarding,
    loading,
    error,
    isManualMode,
    setIsManualMode,
    startNewOnboarding,
    advanceStep,
    isAdvancing,
  } = useOnboarding();

  const isAwaitingInput = onboarding?.status === 'PAUSED' && onboarding.config.isManual === true;

  const canStart =
    !loading && (!onboarding || ['COMPLETED', 'CANCELLED'].includes(onboarding.status));

  const handleStart = (): void => {
    startNewOnboarding([]);
  };

  const handleAdvance = (formData: Record<string, string>) => {
    if (!onboarding) return;
    const stepKey = STEP_PAYLOAD_KEY[onboarding.currentStep];
    const payload = stepKey ? { [stepKey]: formData } : formData;
    advanceStep({ id: onboarding.id, payload });
  };

  const renderStepStatus = (index: number): React.ReactNode => {
    if (!onboarding) return <Circle className="text-gray-300 w-5 h-5" />;

    const stepNumber: number = index + 1;
    const isCurrent: boolean = onboarding.currentStep === stepNumber;

    if (onboarding.currentStep > stepNumber || onboarding.status === 'COMPLETED') {
      return <CheckCircle2 className="text-green-500 w-5 h-5" />;
    }

    if (isCurrent) {
      if (onboarding.status === 'PROCESSING') {
        return <Loader2 className="text-blue-500 w-5 h-5 animate-spin" />;
      }
      if (onboarding.status === 'FAILED') {
        return <XCircle className="text-red-500 w-5 h-5" />;
      }
      if (onboarding.status === 'PAUSED') {
        return <Loader2 className="text-amber-500 w-5 h-5 animate-pulse" />;
      }
      return <Loader2 className="text-yellow-500 w-5 h-5 animate-pulse" />;
    }

    return <Circle className="text-gray-300 w-5 h-5" />;
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '540px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2 style={{ marginBottom: '0.25rem' }}>Simulador de Onboarding Financiero</h2>
      <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Interfaz del usuario final — TanStack Query + Axios + Express Worker
      </p>

      {/* Toggle modo interactivo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1rem',
          padding: '0.75rem 1rem',
          backgroundColor: isManualMode ? '#eff6ff' : '#f9fafb',
          border: `1px solid ${isManualMode ? '#bfdbfe' : '#e5e7eb'}`,
          borderRadius: '8px',
        }}
      >
        <button
          type="button"
          role="switch"
          aria-checked={isManualMode}
          onClick={() => setIsManualMode(!isManualMode)}
          disabled={!!onboarding && !['COMPLETED', 'CANCELLED'].includes(onboarding.status)}
          style={{
            width: '44px',
            height: '24px',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: isManualMode ? '#2563eb' : '#d1d5db',
            cursor:
              !!onboarding && !['COMPLETED', 'CANCELLED'].includes(onboarding.status)
                ? 'not-allowed'
                : 'pointer',
            position: 'relative',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: '2px',
              left: isManualMode ? '22px' : '2px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: 'white',
              transition: 'left 0.15s',
            }}
          />
        </button>
        <div>
          <span
            style={{
              fontWeight: 600,
              fontSize: '0.9rem',
              color: isManualMode ? '#1d4ed8' : '#374151',
            }}
          >
            Modo Interactivo
          </span>
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#6b7280' }}>
            {isManualMode
              ? 'Cada paso pedirá datos reales antes de avanzar'
              : 'El Worker ejecuta todos los pasos automáticamente'}
          </p>
        </div>
      </div>

      <button
        onClick={handleStart}
        disabled={!canStart}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1.5rem',
          backgroundColor: canStart ? '#0070f3' : '#93c5fd',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '1rem',
          cursor: canStart ? 'pointer' : 'not-allowed',
          marginBottom: '1rem',
        }}
      >
        {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Play className="w-4 h-4" />}
        Iniciar Nuevo Registro
      </button>

      {error && <p style={{ color: 'red', marginTop: '0.5rem' }}>⚠️ {error}</p>}

      {onboarding && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.6rem 1rem',
            backgroundColor: '#f5f5f5',
            borderRadius: '6px',
            fontSize: '0.85rem',
          }}
        >
          <span style={{ color: '#888' }}>ID: </span>
          <span style={{ fontFamily: 'monospace', color: '#444' }}>{onboarding.id}</span>
          {'  ·  '}
          <span style={{ color: '#888' }}>Estado: </span>
          <strong>{onboarding.status}</strong>
        </div>
      )}

      {/* Formulario del paso actual (modo manual + PAUSED) */}
      {isAwaitingInput && onboarding && (
        <div
          style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
          }}
        >
          <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem', color: '#1d4ed8' }}>
            Paso {onboarding.currentStep} — {STEP_TITLES[onboarding.currentStep]}
          </h3>
          <p style={{ margin: '0 0 1rem', fontSize: '0.82rem', color: '#3b82f6' }}>
            Completá los datos para continuar el onboarding
          </p>
          <StepForm
            key={onboarding.currentStep}
            stepNumber={onboarding.currentStep}
            onSubmit={handleAdvance}
            isSubmitting={isAdvancing}
          />
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {STEP_NAMES.map((name, index) => {
          const stepNumber = index + 1;
          const isCurrent = onboarding?.currentStep === stepNumber;
          const isPaused = isCurrent && onboarding?.status === 'PAUSED';

          return (
            <div
              key={name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.75rem',
                borderRadius: '6px',
                border: isPaused
                  ? '1px solid #f59e0b'
                  : isCurrent
                    ? '1px solid #0070f3'
                    : '1px solid #eee',
                backgroundColor: isPaused ? '#fffbeb' : isCurrent ? '#f0f7ff' : 'white',
              }}
            >
              {renderStepStatus(index)}
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.78rem', color: '#888', display: 'block' }}>
                  Paso {stepNumber}
                </span>
                <strong style={{ textTransform: 'capitalize', fontSize: '0.9rem' }}>
                  {name.replace(/_/g, ' ')}
                </strong>
              </div>
              {isPaused && (
                <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600 }}>
                  Esperando datos
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
