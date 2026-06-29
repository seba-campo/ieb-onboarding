import { Request, Response } from 'express';
import { onboardingService } from '../service/onboarding.service';
import { AdvanceStepDTO, CreateOnboardingDTO } from '../dtos/onboarding.dto';

export const onboardingController = {
  async create(req: Request<{}, {}, CreateOnboardingDTO>, res: Response) {
    try {
      const { optionalSteps, isManual } = req.body;
      const newOnboarding = await onboardingService.startOnboarding({ optionalSteps, isManual });
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

  async list(req: Request, res: Response) {
    try {
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
      const results = await onboardingService.listOnboardings({ status, limit, offset });
      return res.status(200).json(results);
    } catch (error) {
      console.error('Error en onboardingController.list:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  async pause(req: Request<{ id: string }>, res: Response) {
    try {
      await onboardingService.pauseOnboarding(req.params.id);
      return res.status(200).json({ message: 'Proceso pausado con éxito.' });
    } catch (error: any) {
      if (error.message === 'ONBOARDING_NOT_FOUND') return res.status(404).json({ error: 'Onboarding no encontrado' });
      if (error.message === 'ONBOARDING_CANNOT_PAUSE') return res.status(409).json({ error: 'El onboarding no puede pausarse en su estado actual' });
      console.error('Error en onboardingController.pause:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  async resume(req: Request<{ id: string }>, res: Response) {
    try {
      await onboardingService.resumeOnboarding(req.params.id);
      return res.status(200).json({ message: 'Proceso reanudado con éxito.' });
    } catch (error: any) {
      if (error.message === 'ONBOARDING_NOT_FOUND') return res.status(404).json({ error: 'Onboarding no encontrado' });
      if (error.message === 'ONBOARDING_NOT_PAUSED') return res.status(409).json({ error: 'El onboarding no está en estado PAUSED' });
      console.error('Error en onboardingController.resume:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  async cancel(req: Request<{ id: string }>, res: Response) {
    try {
      await onboardingService.cancelOnboarding(req.params.id);
      return res.status(200).json({ message: 'Proceso cancelado definitivamente.' });
    } catch (error: any) {
      if (error.message === 'ONBOARDING_NOT_FOUND') return res.status(404).json({ error: 'Onboarding no encontrado' });
      if (error.message === 'ONBOARDING_ALREADY_TERMINAL') return res.status(409).json({ error: 'El onboarding ya está en un estado terminal' });
      console.error('Error en onboardingController.cancel:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  async advance(req: Request<{ id: string }, {}, AdvanceStepDTO>, res: Response) {
    try {
      const { id } = req.params;
      const { payload } = req.body;

      if (!payload || typeof payload !== 'object') {
        return res.status(400).json({ error: 'El campo payload es requerido' });
      }

      const updated = await onboardingService.advanceStep(id, { payload });
      return res.status(200).json(updated);
    } catch (error: any) {
      if (error.message === 'ONBOARDING_NOT_FOUND') {
        return res.status(404).json({ error: 'Onboarding no encontrado' });
      }
      if (error.message === 'ONBOARDING_NOT_PAUSED') {
        return res.status(409).json({ error: 'El onboarding no está en estado PAUSED' });
      }
      console.error('Error en OnboardingController.advance:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
};
