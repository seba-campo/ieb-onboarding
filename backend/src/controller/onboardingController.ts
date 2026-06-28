import { Request, Response } from 'express';
import { onboardingService } from '../service/onboarding.service';
import { CreateOnboardingDTO } from '../dtos/onboarding.dto';

export const onboardingController = {
  async create(req: Request<{}, {}, CreateOnboardingDTO>, res: Response) {
    try {
      const { optionalSteps } = req.body;

      // Ejecutamos el caso de uso
      const newOnboarding = await onboardingService.startOnboarding({ optionalSteps });

      return res.status(201).json(newOnboarding);
    } catch (error) {
      console.error('Error en OnboardingController.create:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  async getStatus(req: Request<{ id: string }>, res: Response) {
    try {
      const { id } = req.params;
      const onboarding = await onboardingService.getStatus(id);
      return res.status(200).json(onboarding);
    } catch (error: any) {
      if (error.message === 'ONBOARDING_NOT_FOUND') {
        return res.status(404).json({ error: 'Onboarding no encontrado' });
      }
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
};
