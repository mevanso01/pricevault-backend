import * as express from 'express';
import { body, validationResult } from 'express-validator';
import * as Mongoose from 'mongoose';
import 'moment-timezone';

import Asset from "../../models/Asset";

export default class AssetController {
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
     * POST: create a asset
     */
    this.router.post('/',
      body('name').notEmpty(),
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
          const name = req.body.name;
          const userId = req['user'].id;

          // Check if name is duplicated
          const duplicates = await Asset.find({
            name
          }).exec();
          if (duplicates.length > 0) {
            return res.json({
              success: false,
              errors: [
                'Asset exists with the same name'
              ]
            })
          }

          // Add new one
          const asset = await Asset.create({
            name,
            userId
          });

          res.json({
            success: true,
            errors: [],
            items:asset
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
     * PUT: update a asset
     */
    this.router.put('/',
      body('_id').notEmpty(),
      body('name').notEmpty(),
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
          const { _id, name } = req.body;
          const userId = req['user'].id;

          // Check if name is duplicated
          const find = await Asset.find({
            _id
          }).exec();
          if (find.length == 0) {
            return res.json({
              success: false,
              errors: [
                'Asset no exists in database.'
              ]
            })
          }

          // Add new one
          await Asset.findByIdAndUpdate(_id, { name, userId })

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
     * POST: delete multiple assets
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
          await Asset.deleteMany({ $and: [ { _id: { $in: items } }, { userId: req['user'].id }] });

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
     * GET: get all assets
     */
    this.router.get('/', this.authMiddleware, async (req: express.Request, res: express.Response) => {
      const assets = await Asset.find().exec();

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