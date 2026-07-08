import type { Request, Response, Router } from 'express';
import type { CreateUserUseCase, GetUserUseCase, UpdateUserUseCase } from '@caddisfly/core';
import { DuplicateEmailError, UserNotFoundError, InvalidEmailError } from '@caddisfly/core';

export function createUserRoutes(
  createUser: CreateUserUseCase,
  getUser: GetUserUseCase,
  updateUser: UpdateUserUseCase,
): Router {
  const { Router } = require('express');
  const router = Router() as Router;

  router.post('/', async (req: Request, res: Response) => {
    try {
      const result = await createUser.execute(req.body);
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof DuplicateEmailError) {
        return res.status(409).json({ error: err.message });
      }
      if (err instanceof InvalidEmailError) {
        return res.status(400).json({ error: err.message });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const result = await getUser.execute(req.params.id);
      res.json(result);
    } catch (err) {
      if (err instanceof UserNotFoundError) {
        return res.status(404).json({ error: err.message });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.patch('/:id', async (req: Request, res: Response) => {
    try {
      const result = await updateUser.execute(req.params.id, req.body);
      res.json(result);
    } catch (err) {
      if (err instanceof UserNotFoundError) {
        return res.status(404).json({ error: err.message });
      }
      if (err instanceof DuplicateEmailError) {
        return res.status(409).json({ error: err.message });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
