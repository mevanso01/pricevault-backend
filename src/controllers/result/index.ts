import * as express from 'express';
import { body, validationResult } from 'express-validator';
import * as Mongoose from 'mongoose';
import * as moment from 'moment';
import 'moment-timezone';

import Submission from "../../models/Submission";
import Trade from "../../models/Trade";
import User from "../../models/User";
import InstrumentType from '../../models/InstrumentType';

import AllStrikesFunc = require('../../functions/allStrikesFunc');

export default class ResultController {
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
     * POST: get all submissions by instrument type and timeframe
     * Chart1 (Sum of all stdevs)
     */
    this.router.post('/all-strikes',
      body('type').notEmpty(),
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
          const { type: instrumentTypeId, date } = req.body;
          const lUserId = req['user'].id;

          // Get selectede instrument type by id
          const instrumentType = await InstrumentType.findById(instrumentTypeId).exec();
          let tfHash = moment(date).format('yyyyMMDD');
          if (instrumentType.serviceFrequency == 'Monthly') {
            tfHash = moment(date).format('yyyyMM');
          }

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
          const submissions = await Submission.find({ $and: [{ tradeId: { $in: tradeIds } }, { tfHash: { $regex: tfHash, $options: "i" } }] }).exec();
          // const submissions = await Submission.find({ $and: [{ tradeId: { $in: tradeIds } }] }).exec();

          if (tradeIds.length === 0 || !submissions || submissions.length === 0) {
            return res.json({
              success: false,
              items: {
                data: [],
                dataRange: [],
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
          });
          // Call main calculation function
          const Calc = new AllStrikesFunc(lUserId, tradesByInsType);
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
      }
    );
  }
}