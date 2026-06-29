import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, Query } from '@tanstack/react-query';
import { onboardingService } from '../../api/onboarding';
import { OnboardingResponse } from '../../types/onboarding.types';

interface AdvanceStepArgs {
  id: string;
  payload: Record<string, string>;
}

interface UseOnboardingReturn {
  onboarding: OnboardingResponse | null;
  loading: boolean;
  error: string | null;
  isManualMode: boolean;
  setIsManualMode: (value: boolean) => void;
  startNewOnboarding: (optionalSteps: string[]) => void;
  advanceStep: (args: AdvanceStepArgs) => void;
  isAdvancing: boolean;
}

export const useOnboarding = (): UseOnboardingReturn => {
  const [activeOnboardingId, setActiveOnboardingId] = useState<string | null>(null);
  const [isManualMode, setIsManualMode] = useState(false);
  const queryClient = useQueryClient();

  const {
    mutate: _startMutation,
    data: createdOnboarding,
    isPending,
    error: mutationError,
  } = useMutation<OnboardingResponse, Error, { optionalSteps: string[]; isManual: boolean }>({
    mutationFn: ({ optionalSteps, isManual }) => onboardingService.start(optionalSteps, isManual),
    onSuccess: (newOnboarding: OnboardingResponse) => {
      setActiveOnboardingId(newOnboarding.id);
    },
  });

  // Wrapper que lee isManualMode en el momento del click, no en el momento del render
  const startNewOnboarding = (optionalSteps: string[]) => {
    _startMutation({ optionalSteps, isManual: isManualMode });
  };

  const { data: onboardingStatus, error: statusError } = useQuery<OnboardingResponse, Error>({
    queryKey: ['onboardingStatus', activeOnboardingId],
    queryFn: () => onboardingService.getStatus(activeOnboardingId),
    enabled: !!activeOnboardingId,
    refetchInterval: (query: Query<OnboardingResponse, Error>) => {
      const currentData = query.state.data;
      if (!currentData) return 1500;
      const isTerminal = ['COMPLETED', 'CANCELLED'].includes(currentData.status);
      return isTerminal ? false : 1500;
    },
  });

  const { mutate: advanceStep, isPending: isAdvancing } = useMutation<
    OnboardingResponse,
    Error,
    AdvanceStepArgs
  >({
    mutationFn: ({ id, payload }: AdvanceStepArgs) => onboardingService.advanceStep(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboardingStatus', activeOnboardingId] });
    },
  });

  return {
    onboarding: onboardingStatus || createdOnboarding || null,
    loading: isPending,
    error: mutationError?.message || statusError?.message || null,
    isManualMode,
    setIsManualMode,
    startNewOnboarding,
    advanceStep,
    isAdvancing,
  };
};
