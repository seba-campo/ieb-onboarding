import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos de tolerancia de red
});

// Interceptor de respuesta con tipado implícito de Axios para extraer el data directamente
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error: AxiosError<{ error?: string }>) => {
    const message = error.response?.data?.error || 'Error de conexión con el servidor';
    return Promise.reject(new Error(message));
  }
);
