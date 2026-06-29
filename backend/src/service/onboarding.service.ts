import { onboardingRepository } from '../repository/onboardingRepository';
import { AdvanceStepDTO, CreateOnboardingDTO, OnboardingResponseDTO } from '../dtos/onboarding.dto';

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
