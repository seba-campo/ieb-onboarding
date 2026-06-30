# IEB Onboarding Engine

Sistema de onboarding masivo automatizado para incorporar usuarios mediante un flujo de 8 pasos secuenciales. Diseñado para procesar miles de solicitudes concurrentes con tolerancia a fallos, reintentos con backoff exponencial, alertas proactivas a Slack y un dashboard operativo en tiempo real.

---

## Stack

| Capa             | Tecnología                       | Decisión                                                         |
| ---------------- | -------------------------------- | ---------------------------------------------------------------- |
| Backend          | Node.js + Express 5 + TypeScript | Bajo overhead, I/O no bloqueante ideal para concurrencia masiva  |
| Base de datos    | Neon (PostgreSQL Serverless)     | Connection pooler en modo transacción; SKIP LOCKED nativo        |
| ORM / Driver     | `pg` (driver nativo)             | Raw SQL — control total sobre las queries de bloqueo concurrente |
| Cola de trabajos | PostgreSQL (Database Queue)      | Sin Redis ni BullMQ — ver decisión de arquitectura más abajo     |
| Tiempo real      | Server-Sent Events (SSE)         | Unidireccional, sin overhead de WebSockes.                       |
| Alertas          | Slack Incoming Webhooks          | Integración directa, sin broker externo                          |
| Frontend         | React 19 + Vite + TanStack Query | SPA liviana con polling controlado y streaming SSE               |

---

## Arquitectura

### Capas (Clean Architecture Pragmática)

```
backend/src/
├── controller/     # HTTP: valida request, llama al service, responde
├── service/        # Lógica de negocio: reglas, transiciones de estado, alertas
├── repository/     # Acceso a datos: SQL nativo con pg, sin lógica de negocio
├── workers/        # Loop infinito: consume la cola de DB via SKIP LOCKED
├── middleware/     # correlationId: UUID por request HTTP
└── utils/          # logger: JSON estructurado a stdout/stderr
```

Cada capa conoce solo a la inmediatamente inferior. El worker no conoce a Express; los repositorios no conocen al negocio.

### Flujo de un onboarding

```
POST /api/onboardings
       │
       ▼
  onboardingService.startOnboarding()
       │  INSERT INTO onboardings (status='PENDING', current_step=1)
       ▼
  Worker loop (100ms polling)
       │  SELECT ... FOR UPDATE SKIP LOCKED → status='PROCESSING'
       ▼
  stepProcessor.executeStep(step)   ← mock con latencia 400–800ms + 5% fallo
       │
  ┌────┴────┐
  │ SUCCESS │ → UPDATE status='PENDING', current_step+1  (o 'COMPLETED' en paso 8)
  │ FAILURE │ → UPDATE status='FAILED', attempts+1, next_attempt_at=NOW()+backoff
  └─────────┘
       │  INSERT INTO onboarding_logs (step, status, duration_ms)
       ▼
  SSE stream → Dashboard se actualiza cada 3s
```

---

## Decisión clave: Database Queue vs Redis/BullMQ

El sistema de cola se implementa directamente sobre PostgreSQL usando el patrón **SELECT FOR UPDATE SKIP LOCKED**. Esta decisión fue intencional y tiene 4 fundamentos principales.

- `SELECT ... FOR UPDATE SKIP LOCKED` es atómico: la fila se bloquea y se asigna en una sola operación, sin condiciones de carrera posibles
- Múltiples instancias del worker pueden correr en paralelo sobre la misma DB sin coordinación adicional
- El historial, logs y métricas están en el mismo motor — no hay que sincronizar dos fuentes de verdad
- Neon (PostgreSQL serverless) tiene soporte nativo y maneja bien la contención a este nivel de concurrencia

**Por qué no Redis/BullMQ:**

- Infraestructura adicional innecesaria para la escala de este sistema y el alcance del challenge.
- Redis introduce un segundo punto de fallo independiente de la base de datos.
- BullMQ agrega una capa de abstracción que oculta el comportamiento real de la cola.
- El estado de cada trabajo ya vive en PostgreSQL — duplicarlo en Redis crea inconsistencias y costo extra de mantencion.

**La query central:**

```sql
UPDATE onboardings SET status = 'PROCESSING', updated_at = NOW()
WHERE id = (
  SELECT id FROM onboardings
  WHERE status IN ('PENDING', 'FAILED')
    AND next_attempt_at <= NOW()
  ORDER BY created_at ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1
) RETURNING id, status, current_step, attempts, config;
```

La clave es `FOR UPDATE SKIP LOCKED`: si otro worker ya tomó esa fila, la saltea en vez de esperar. Elimina deadlocks y permite hasta 25 tareas en vuelo simultáneamente (`MAX_CONCURRENCY = 25`) .

---

## Modelo de datos

![[Pasted image 20260630133308.png]]

### Los 8 pasos del onboarding

| #   | Nombre interno          | Descripción                       | Simulado? |
| --- | ----------------------- | --------------------------------- | --------- |
| 1   | `identity_verification` | Validación DNI contra RENAPER     | ✅        |
| 2   | `email_confirmation`    | OTP por email                     | ✅        |
| 3   | `phone_verification`    | OTP por SMS                       | ✅        |
| 4   | `document_upload`       | OCR de documentos                 | ✅        |
| 5   | `selfie_check`          | Liveness detection + match facial |           |
| 6   | `risk_scoring`          | Score crediticio (0–100)          |           |
| 7   | `account_creation`      | Generación de CVU                 |           |
| 8   | `welcome_kit`           | Email + envío de tarjeta          | ✅        |

---

## Sistema de alertas

El `alertService` se ejecuta cada 60 segundos en el worker y dispara notificaciones a Slack cuando se detectan:

| Alerta                      | Condición                                                                              | Clave de cooldown          |
| --------------------------- | -------------------------------------------------------------------------------------- | -------------------------- |
| Baja conversión             | `completados / total < LOW_CONVERSION_RATE` (mínimo `CONVERSION_MIN_SAMPLE` registros) | `low_conversion`           |
| Alta tasa de error por paso | `error_rate_pct > HIGH_STEP_ERROR_RATE_PCT`                                            | `high_step_failure:<step>` |
| Onboardings estancados      | Cantidad en PENDING/PROCESSING sin avanzar > `STUCK_MIN_COUNT`                         | `stuck_onboarding`         |
| Spike de errores            | Fallos en últimos 5 min > `ERROR_SPIKE_COUNT`                                          | `error_spike`              |

El **cooldown** es un `Map<string, timestamp>` en memoria por instancia. Si la misma alerta se disparó hace menos de `COOLDOWN_MS` (default: 30 min), se suprime. Todos los umbrales son configurables en tiempo de ejecución desde la tabla `system_configs`.

---

## Logging estructurado y trazabilidad

Todos los logs del backend emiten JSON a stdout (info/debug) o stderr (warn/error) (consola).

```json
{"ts":"2026-06-30T14:22:01.345Z","level":"info","msg":"Motor de procesamiento concurrente inicializado","maxConcurrency":25}
{"ts":"2026-06-30T14:22:05.120Z","level":"error","msg":"onboardingController.create falló","correlationId":"f3a1b2c4-...","error":"connection timeout"}
```

Cada request HTTP recibe un `correlationId` UUID (generado en el middleware o tomado del header `x-correlation-id`), que se propaga a todos los logs del ciclo de vida de esa request.

---

## Cómo correr el proyecto

```bash
# Backend
cd backend
npm install
npm run dev          # tsx watch — hot reload

# Frontend
cd frontend
npm install
npm run dev          # Vite dev server en :5173

# Test de concurrencia (inyecta 500 onboardings en ráfagas de 50)
cd backend
npm run test:concurrency
```

---

## API Reference

Link a la documentacion Postman: https://documenter.getpostman.com/view/23923667/2sBXwyJ7zB

---

## Decisiones de diseño del frontend

- **TanStack Query** para el historial: el `queryKey` incluye los filtros, lo que garantiza refetch automático al cambiar fechas u orden
- **SSE nativo** (`EventSource`) para el dashboard activo, sin librerías extra
- **Custom hooks** colocados junto al componente que los usa (`useConfigPanel.ts` al lado de `ConfigPanel/)
- **Inline styles** en toda la UI — sin Tailwind ni CSS modules — para máxima portabilidad y cero configuración de build adicional.
