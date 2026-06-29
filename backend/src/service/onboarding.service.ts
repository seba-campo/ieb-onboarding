import { onboardingRepository } from '../repository/onboardingRepository';
import { AdvanceStepDTO, CreateOnboardingDTO, OnboardingResponseDTO } from '../dtos/onboarding.dto';

export interface ListOnboardingsOptions {
  status?: string;
  limit?: number;
  offset?: number;
}

export const onboardingService = {
  async startOnboarding(dto: CreateOnboardingDTO): Promise<OnboardingResponseDTO> {
    const steps = dto.optionalSteps || [];
    const isManual = dto.isManual ?? false;
    return await onboardingRepository.create(steps, isManual);
  },

  async getStatus(id: string): Promise<OnboardingResponseDTO> {
    const onboarding = await onboardingRepository.findById(id);
    if (!onboarding) {
      throw new Error('ONBOARDING_NOT_FOUND');
    }
    return onboarding;
  },

  async listOnboardings(options: ListOnboardingsOptions): Promise<OnboardingResponseDTO[]> {
    return onboardingRepository.findAll(options);
  },

  async pauseOnboarding(id: string): Promise<void> {
    const onboarding = await onboardingRepository.findById(id);
    if (!onboarding) throw new Error('ONBOARDING_NOT_FOUND');
    if (onboarding.status !== 'PENDING' && onboarding.status !== 'PROCESSING') {
      throw new Error('ONBOARDING_CANNOT_PAUSE');
    }
    await onboardingRepository.updateStatus(id, 'PAUSED');
  },

  async resumeOnboarding(id: string): Promise<void> {
    const onboarding = await onboardingRepository.findById(id);
    if (!onboarding) throw new Error('ONBOARDING_NOT_FOUND');
    if (onboarding.status !== 'PAUSED') throw new Error('ONBOARDING_NOT_PAUSED');
    await onboardingRepository.updateStatus(id, 'PENDING');
  },

  async cancelOnboarding(id: string): Promise<void> {
    const onboarding = await onboardingRepository.findById(id);
    if (!onboarding) throw new Error('ONBOARDING_NOT_FOUND');
    if (onboarding.status === 'COMPLETED' || onboarding.status === 'CANCELLED') {
      throw new Error('ONBOARDING_ALREADY_TERMINAL');
    }
    await onboardingRepository.updateStatus(id, 'CANCELLED');
  },

  async advanceStep(id: string, dto: AdvanceStepDTO): Promise<OnboardingResponseDTO> {
    const onboarding = await onboardingRepository.findById(id);
    if (!onboarding) {
      throw new Error('ONBOARDING_NOT_FOUND');
    }
    if (onboarding.status !== 'PAUSED') {
      throw new Error('ONBOARDING_NOT_PAUSED');
    }
    const updated = await onboardingRepository.advanceStep(id, dto.payload);
    if (!updated) {
      throw new Error('ONBOARDING_NOT_FOUND');
    }
    return updated;
  },
};
