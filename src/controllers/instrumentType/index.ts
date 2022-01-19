import * as express from 'express';
import { body, validationResult } from 'express-validator';
import * as Mongoose from 'mongoose';
import 'moment-timezone';

import InstrumentType from "../../models/InstrumentType";

export default class InstrumentTypeController {
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
     * POST: create a instrument
     */
    this.router.post('/',
      body('name').notEmpty(),
      body('currency').notEmpty(),
      body('serviceFrequency').notEmpty(),
      body('pricingTZ').notEmpty(),
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
          const { name, currency, serviceFrequency, pricingTZ, pricingTime, assetId } = req.body;
          const userId = req['user'].id;

          // Check if name is duplicated
          const duplicates = await InstrumentType.find({
            name, currency, serviceFrequency
          }).exec();
          if (duplicates.length > 0) {
            return res.json({
              success: false,
              errors: [
                'InstrumentType exists with the same name'
              ]
            })
          }

          // Add new one
          const instrumentType = await InstrumentType.create({
            name, 
            currency, 
            serviceFrequency, 
            pricingTZ, 
            pricingTime, 
            assetId, 
            userId
          });

          res.json({
            success: true,
            errors: [],
            items: instrumentType
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
     * PUT: update a instrument
     */
    this.router.put('/',
      body('_id').notEmpty(),
      body('name').notEmpty(),
      body('currency').notEmpty(),
      body('serviceFrequency').notEmpty(),
      body('pricingTZ').notEmpty(),
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
          const { 
            _id, 
            name, 
            currency, 
            serviceFrequency, 
            pricingTZ, 
            pricingTime, 
            assetId 
          } = req.body;
          const userId = req['user'].id;

          // Check if id is existing
          const find = await InstrumentType.find({
            _id
          }).exec();
          if (find.length == 0) {
            return res.json({
              success: false,
              errors: [
                'Instrument no exists in database.'
              ]
            })
          }

          // Add new one
          await InstrumentType.findByIdAndUpdate(_id, 
            { name, currency, serviceFrequency, pricingTZ, pricingTime, assetId, userId });

          res.json({
            success: true,
            errors: [],
          });
        } catch (err) {
          console.log(err);
          const errors = ['Failed to update into database'];
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
     * POST: delete multiple instrument
     */
    this.router.post('/remove',
      body('items').notEmpty(),
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
          const items = req.body.items;

          // Delete assets
          await InstrumentType.deleteMany({ $and: [ { _id: { $in: items } }, { userId: req['user'].id }] });

          res.json({
            success: true,
            errors: []
          });
        } catch (err) {
          console.log(err);
          const errors = ['Failed to delete asset data.'];
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
     * GET: get all instrument
     */
    this.router.get('/', this.authMiddleware, async (req: express.Request, res: express.Response) => {
      const assets = await InstrumentType.find().exec();

      if (!assets) {
        return res.json({
          success:false,
          items: []
        });
      }

      res.json({
        success: true,
        items: assets
      })
    });
  }
}