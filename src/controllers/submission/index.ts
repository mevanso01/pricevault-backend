import * as express from 'express';
import { body, validationResult } from 'express-validator';
import * as Mongoose from 'mongoose';
import * as moment from 'moment';
import 'moment-timezone';

import Submission from "../../models/Submission";
import Trade from "../../models/Trade";

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
          const now = moment(new Date()).tz('America/New_York').format('yyyyMMDD');
          var payload = [];
          var tradeIdArr = [];

          items.map((item) => {
            tradeIdArr.push(item.tradeId);
            payload.push({
              ...item,
              tfHash: now,
              userId: req['user'].id
            })
          });

          // Delete old one
          await Submission.deleteMany({ $and: [{ tradeId: { $in: tradeIdArr } }, { tfHash: now }, { userId: req['user'].id }] });
          // Add new one
          await Submission.insertMany(payload, { ordered: false });

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
     * POST: check duplicated items in timeframe or whole database
     */
    this.router.post('/check-validate',
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
          const items = JSON.parse(req.body.items);

          // Check unique instrument type for all trades
          const ins_type_ids = await Trade.find({ tradeId: { $in: items } }).populate('instrumentTypeId').exec();
          const unique_ins_type = ins_type_ids.every(v => String(v.instrumentTypeId) == String(ins_type_ids[0].instrumentTypeId));
          // Check duplicated trades within time frame
          const serviceFreq = ins_type_ids[0].instrumentTypeId.serviceFrequency;
          let tf = serviceFreq == "Monthly"
            ? moment(new Date()).tz('America/New_York').format('yyyyMM') // serviceFrequency = "Monthly"
            : moment(new Date()).tz('America/New_York').format('yyyyMMDD'); // serviceFrequency = "Daily"
          const tf_duplicates_ids = await Submission.find({ $and: [{ tradeId: { $in: items } }, { tfHash: { $regex: tf + '.*' } }, { userId: req['user'].id }] }, 'tradeId').exec();
          // Check unique trade id for trade id list from admin side
          const valid_items = await Trade.find({ tradeId: { $in: items } }, 'tradeId').exec();
          const valid_ids = valid_items.map(item => item.tradeId);
          const invalid_ids = items.filter(item => !valid_ids.includes(item));

          res.json({
            success: true,
            result: {
              unique_ins_type,
              tf_duplicates_ids,
              invalid_ids
            }
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

    /**
     * GET: get all submissions
     */
    this.router.get('/', this.authMiddleware, async (req: express.Request, res: express.Response) => {
      try {
        const submission = await Submission.find().exec();

        if (!submission) {
          return res.json({
            success: false,
            items: []
          });
        }

        res.json({
          success: true,
          items: submission
        })
      } catch (err) {
        console.log(err);
        const errors = ['Failed to fetch submission data.'];
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
    });
  }
}