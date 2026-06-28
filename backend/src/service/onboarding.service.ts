import { onboardingRepository } from '../repository/onboardingRepository';
import { CreateOnboardingDTO, OnboardingResponseDTO } from '../dtos/onboarding.dto';

export const onboardingService = {
  async startOnboarding(dto: CreateOnboardingDTO): Promise<OnboardingResponseDTO> {
    const steps = dto.optionalSteps || [];
    return await onboardingRepository.create(steps);
  },

  async getStatus(id: string): Promise<OnboardingResponseDTO> {
    const onboarding = await onboardingRepository.findById(id);
    if (!onboarding) {
      throw new Error('ONBOARDING_NOT_FOUND');
    }
    return onboarding;
  },
};
