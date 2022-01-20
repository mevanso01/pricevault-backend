import * as express from 'express';
import { body, validationResult } from 'express-validator';
import * as Mongoose from 'mongoose';
import 'moment-timezone';
import { adminMiddleware } from './../../middlewares';

import Trade from "../../models/Trade";

export default class TradeController {
  router: any = null;
  authMiddleware: any = null;

  constructor(authMiddleware: any = null) {
    this.router = express.Router();
    this.authMiddleware = authMiddleware;

    this.router.use(this.authMiddleware);
    this.router.use(adminMiddleware);

    this.configure();
  }

  configure() {
    /**
     * POST: submit trades
     */
    this.router.post('/',
      body('items').notEmpty(),
      body('instrumentTypeId').notEmpty(),
      async (req: express.Request, res: express.Response) => {
        // Validate request payload
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.json({
            success: false,
            errors: ['Invalid request payload']
          })
        }

        try {
          const items = JSON.parse(req.body.items);
          const instrumentTypeId = req.body.instrumentTypeId;

          var payload = [];
          var tradeIdArr = [];
          
          items.map((item) => {
            tradeIdArr.push(item.tradeId);
            payload.push({
              ...item,
              instrumentTypeId,
              userId: req['user'].id
            })
          });
     
          // Delete old one
          await Trade.deleteMany({ $and: [ { tradeId: { $in: tradeIdArr } }] });
          // Add new one
          await Trade.insertMany(payload, {ordered: false});

          res.json({
            success: true,
            errors: []
          });
        } catch (err) {
          console.log(err);
          const errors = ['Failed to store into database'];
          if (err instanceof Mongoose.Error) {
            errors.push(err.message);
          } else {
            errors.push(err);
          }
          res.json({
            success: false,
            errors
          });
        }
      }
    );

    /**
     * POST: check duplicated trades
     */
    this.router.post('/check-trades',
      body('items').notEmpty(),
      body('instrumentTypeId').notEmpty(),
      async (req: express.Request, res: express.Response) => {
        // Validate request payload
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.json({
            success: false,
            errors: ['Invalid request payload']
          })
        }

        try {
          const items = JSON.parse(req.body.items);
          const instrumentTypeId = req.body.instrumentTypeId;

          const duplicates = await Trade.find({ $and: [ { tradeId: { $in: items } }] }).exec();

          res.json({
            success: true,
            duplicates: duplicates.length
          });
        } catch (err) {
          console.log(err);
          const errors = ['Failed to check duplicated data.'];
          if (err instanceof Mongoose.Error) {
            errors.push(err.message);
          } else {
            errors.push(err);
          }
          res.json({
            success: false,
            errors
          });
        }
      }
    );
  }
}