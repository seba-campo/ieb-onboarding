import { apiClient } from '../axiosClient';
import { OnboardingResponse } from '../../types/onboarding.types';

export const onboardingService = {
  async start(optionalSteps: string[] = [], isManual = false): Promise<OnboardingResponse> {
    return apiClient.post<any, OnboardingResponse>('/api/onboardings', {
      optionalSteps,
      isManual,
    }) as unknown as OnboardingResponse;
  },

  async getStatus(id: string | null): Promise<OnboardingResponse> {
    if (!id) return Promise.reject(new Error('ID de onboarding requerido para la consulta'));
    return apiClient.get<any, OnboardingResponse>(
      `/api/onboardings/${id}`
    ) as unknown as OnboardingResponse;
  },

  async advanceStep(id: string, payload: Record<string, string>): Promise<OnboardingResponse> {
    return apiClient.post<any, OnboardingResponse>(`/api/onboardings/${id}/advance`, {
      payload,
    }) as unknown as OnboardingResponse;
  },

  async pause(id: string): Promise<void> {
    await apiClient.post(`/api/onboardings/${id}/pause`);
  },

  async resume(id: string): Promise<void> {
    await apiClient.post(`/api/onboardings/${id}/resume`);
  },

  async cancel(id: string): Promise<void> {
    await apiClient.post(`/api/onboardings/${id}/cancel`);
  },
};
