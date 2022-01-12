import * as express from 'express';
import { body, validationResult } from 'express-validator';
import * as Mongoose from 'mongoose';

export default class SubmissionController {
  router: any = null;
  authMiddleware: any = null;

  constructor(authMiddleware: any = null) {
    this.router = express.Router();
    this.authMiddleware = authMiddleware;

    this.router.use(this.authMiddleware);

    this.configure();
  }

  configure() {
    /**
     * POST: submit submissions
     */
    this.router.post('/',
      body('items').notEmpty(),
      async (req: express.Request, res: express.Response) => {
        res.json({
          success: true
        })
      });
  }
}