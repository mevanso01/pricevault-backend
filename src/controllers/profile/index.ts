import * as express from 'express';
import { body, validationResult } from 'express-validator';
import * as Mongoose from 'mongoose';

import User from "../../models/User";

export default class ProfileController {
  router: any = null;
  authMiddleware: any = null;
  saltRounds: Number = 10;

  constructor(authMiddleware: any = null) {
    this.router = express.Router();
    this.authMiddleware = authMiddleware;
    this.configure();
  }

  configure() {
    /**
     * GET: get user profile data
     */
    this.router.get('/', this.authMiddleware, async (req: express.Request, res: express.Response) => {
      const user_id = req['user'].id;
      const user = await User.findById(user_id).exec();

      if (!user) {
        return res.json({
          success: false
        });
      }

      const res_user = {
        displayName: user.displayName,
        email: user.email,
        phone: user.phone || '',
        emailVerified: user.email_verified,
        phoneVerified: user.sms_verified,
        tfa_enable: user.tfa_enable || false,
        role: user.role
      };

      res.json({
        success: true,
        user: res_user
      })
    });

    /**
     * PUT: update profile
     */
    this.router.put('/',
      body('displayName').notEmpty(),
      body('email').notEmpty(),
      this.authMiddleware,
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
          const userId = req['user'].id;
          const { displayName, email, phone, tfa_enable } = req.body;

          // Check if user is existing
          const find = await User.find({
            userId
          }).exec();

          if (find.length == 0) {
            return res.json({
              success: false,
              errors: [
                'User not found.'
              ]
            })
          }

          // Update user
          await User.findByIdAndUpdate(userId,
            {
              displayName,
              email,
              phone,
              tfa_enable
            }
          );

          res.json({
            success: true,
            errors: [],
          });
        } catch (err) {
          console.log(err);
          const errors = ['Failed to update the user'];
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