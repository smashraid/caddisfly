import { Router } from 'express';
import { UserController, type  UserControllerDependencies } from '../controllers/user.controller.js';

export function createUserRouter(deps: UserControllerDependencies): Router {
  const router = Router();
  const controller = new UserController(deps);

  router.post('/', (req, res, next) => {
    controller.create(req, res).catch(next);
  });

  router.get('/:id', (req, res, next) => {
    controller.getById(req, res).catch(next);
  });

  router.patch('/:id', (req, res, next) => {
    controller.update(req, res).catch(next);
  });

  return router;
}