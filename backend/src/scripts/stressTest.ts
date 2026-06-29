import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:3000/api/onboardings';

// CONFIGURACIÓN DEL TEST DE ESTRÉS
const TOTAL_REQUESTS = 200; // Cantidad total de onboardings a crear
const BATCH_SIZE = 20; // Cuántas peticiones enviar EN SIMULTÁNEO por ráfaga

async function sendRequest(index: number): Promise<boolean> {
  // Mezclamos perfiles: algunos usuarios omitirán pasos aleatorios para estresar el motor de config dinámica
  const mixSteps = Math.random() > 0.5 ? ['phone_verification'] : [];

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionalSteps: mixSteps }),
    });

    if (response.ok) {
      return true;
    } else {
      console.error(
        `[❌ Error] Petición #${index} rechazada por el servidor: Status ${response.status}`
      );
      return false;
    }
  } catch (error: any) {
    console.error(`[🚨 Fallo de Red] Petición #${index} no pudo llegar al backend:`, error.message);
    return false;
  }
}

async function runStressTest() {
  console.log('====================================================');
  console.log('🚀 INICIANDO TEST DE ESTRÉS Y CONCURRENCIA - IEB');
  console.log(`🎯 Objetivo: Desplegar ${TOTAL_REQUESTS} onboardings concurrentes`);
  console.log(`⚡ Tamaño de ráfaga simultánea: ${BATCH_SIZE} requests en paralelo`);
  console.log('====================================================\n');

  const startTime = Date.now();
  let successCount = 0;
  let failureCount = 0;

  // Procesamos en ráfagas (Batches) para simular oleadas concurrentes reales de usuarios y no saturar el socket local
  for (let i = 0; i < TOTAL_REQUESTS; i += BATCH_SIZE) {
    const currentBatchSize = Math.min(BATCH_SIZE, TOTAL_REQUESTS - i);
    const promises: Promise<boolean>[] = [];

    console.log(
      `📦 Disparando ráfaga de peticiones de la #${i + 1} a la #${i + currentBatchSize}...`
    );

    for (let j = 0; j < currentBatchSize; j++) {
      promises.push(sendRequest(i + j + 1));
    }

    // Promise.all ejecuta TODAS las promesas del array de forma estrictamente concurrente
    const results = await Promise.all(promises);

    results.forEach((res) => {
      if (res) successCount++;
      else failureCount++;
    });
  }

  const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n====================================================');
  console.log('🏁 TEST DE CONCURRENCIA FINALIZADO');
  console.log(`⏱️ Tiempo total de inyección: ${durationSeconds} segundos`);
  console.log(`✅ Peticiones exitosas: ${successCount}`);
  console.log(`❌ Peticiones fallidas: ${failureCount}`);
  console.log('====================================================');
  console.log(
    '💡 Tip: Revisá tu Dashboard Operativo y la consola de Neon para ver al Worker procesar la cola.'
  );
}

runStressTest();
