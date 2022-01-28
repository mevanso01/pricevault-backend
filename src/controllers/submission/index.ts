import * as express from 'express';
import { body, validationResult } from 'express-validator';
import * as Mongoose from 'mongoose';
import * as moment from 'moment';
import 'moment-timezone';

import Submission from "../../models/Submission";
import Trade from "../../models/Trade";
import User from "../../models/User";

import SubmissionFunc = require('../../functions/submissionFunc');

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

    /**
     * GET: get all submissions by instrument type and timeframe
     */
    this.router.get('/:type', this.authMiddleware, async (req: express.Request, res: express.Response) => {
      try {
        const instrumentTypeId = req.params.type;
        // Get all users
        const submissionsByUser = await User.find().exec();
        // Get all submissions
        const allSubmissions = await Submission.find().exec();
        // Get available tradeIds by selected instrument type
        const tradesByInsType = await Trade.find({ instrumentTypeId: instrumentTypeId }).exec();
        let tradeIds = [];
        tradesByInsType.forEach((item) => {
          // Filtering tradeId by associated user count (at least 4 users)
          const sub = allSubmissions.filter(sub => sub.tradeId == item.tradeId);
          const uniqueUsers = Array.from(new Set(sub.map(s => s.userId)));
          if (uniqueUsers.length < 4) return;
          tradeIds.push(item.tradeId);
        });
        // Get submissions by filtering tradeId
        // TODO: Filtering tfHash by selected date or month (daily or monthly)
        const submissions = await Submission.find({ tradeId: { $in: tradeIds } }).exec();

        if (tradeIds.length === 0 || !submissions) {
          return res.json({
            success: false,
            items: {
              data: [],
              xRange: []
            }
          });
        }
        // Get valid submission list per users
        let data = [];
        submissionsByUser.map(async (item) => {
          const userSubmissions = submissions.filter(sub => String(sub.userId) == String(item._id));
          if (userSubmissions.length > 0) {
            const dataItem = {
              userId: item._id,
              submissions: userSubmissions
            }
            data.push(dataItem);
          }
        })
        // Call main calculation function
        const Calc = new SubmissionFunc(tradesByInsType);
        const result = Calc.main(data);
        console.log(result);

        res.json({
          success: true,
          items: result
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