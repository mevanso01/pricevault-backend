import * as express from 'express';
import { body, validationResult } from 'express-validator';
import * as Mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as md5 from 'md5';

import User from "../../models/User";

export default class AuthController {
  router: any = null;
  saltRounds: Number = 10;

  constructor() {
    this.router = express.Router();

    this.configure();
  }

  configure() {
    /**
     * POST: register
     */
    this.router.post('/register',
      body('displayName').notEmpty(),
      body('email').notEmpty(),
      body('password').notEmpty(),
      async (req: express.Request, res: express.Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.json({
            success: false,
            errors: [
              'Invalid request payload'
            ]
          })
        }

        try {
          const { displayName, email, password } = req.body;
          const duplicates = await User.find({
            email
          }).exec();
          if (duplicates.length > 0) {
            return res.json({
              success: false,
              errors: [
                'User already exists with the same email address'
              ]
            })
          }

          const hashed = await bcrypt.hash(password, this.saltRounds);
          const user_str = `${email}-${(new Date()).getTime()}`;
          const email_token = md5(user_str);
          const email_token_exp_at = new Date();
          email_token_exp_at.setHours(email_token_exp_at.getHours() + Number(process.env.EMAIL_TOKEN_TIMEOUT || 24));
          const user = await User.create({
            displayName, email,
            password: hashed,
            email_verified: false,
            email_token,
            email_token_exp_at
          });

          res.json({
            success: true
          })
        } catch (err) {
          const errors = ['Failed to create user'];
          if (err instanceof Mongoose.Error) {
            errors.push(err.message)
          } else {
            errors.push(err)
          }
          res.json({
            success: false,
            errors
          })
        }
      });

    /**
     * POST: login
     */
    this.router.post('/login', (req: express.Request, res: express.Response) => {
      res.json({
        success: false,
        errors: [
          'Invalid Email or Password'
        ]
      })
    });
  }
}