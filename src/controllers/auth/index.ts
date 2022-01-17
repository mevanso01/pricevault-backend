import * as express from 'express';
import { body, validationResult } from 'express-validator';
import * as Mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as md5 from 'md5';
import * as jwt from 'jsonwebtoken';

import User from "../../models/User";
import Mailer from '../../utils/Mailer';

export default class AuthController {
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
     * POST: register
     */
    this.router.post('/register',
      body('displayName').notEmpty(),
      body('email').notEmpty(),
      body('password').notEmpty(),
      async (req: express.Request, res: express.Response) => {
        // Validate request payload
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
          const { displayName, email, password, role } = req.body;

          // Check if email is duplicated
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

          // Create User document in the database
          const hashed = await bcrypt.hash(password, this.saltRounds);
          const user_str = `${email}-${(new Date()).getTime()}`;
          const email_token = md5(user_str);
          const email_token_exp_at = new Date();
          email_token_exp_at.setHours(email_token_exp_at.getHours() + Number(process.env.EMAIL_TOKEN_TIMEOUT || 24));
          const user = await User.create({
            displayName, email, role,
            password: hashed,
            email_verified: false,
            email_token,
            email_token_exp_at
          });

          // Send email verification email
          const mailer = new Mailer();
          const link = `${process.env.SERVER_URL}/api/auth/verify-email/${email_token}`;
          try {
            await mailer.sendTemplate(email, 'email_verify', {
              displayName, link
            })
          } catch (err) {
            throw 'Faile to send verification email';
          }

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
     * GET: verify email
     */
    this.router.get('/verify-email/:token', async (req: express.Request, res: express.Response) => {
      const { token } = req.params;

      // Find matching user
      const user = await User.findOne({
        email_token: token,
        email_verified: false
      }).exec();
      if (!user) {
        return res.send("Verification token is invalid.");
      }

      if (user.email_token_exp_at < new Date()) {
        return res.send("Verification token is expired.");
      }

      user.email_verified = true;
      user.email_token = null;
      user.email_token_exp_at = null;
      user.save();

      res.send("Email verified successfully!");
    })

    /**
     * POST: login
     */
    this.router.post('/login',
      body('email').notEmpty(),
      body('password').notEmpty(),
      async (req: express.Request, res: express.Response) => {
        // Validate request payload
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
          const { email, password } = req.body;
          const user = await User.findOne({
            email,
            email_verified: true
          }).exec();

          if (!user) {
            return res.json({
              success: false,
              errors: [
                'Invalid Email or Password'
              ]
            })
          }

          const passwordMatch = await bcrypt.compare(password, user.password);
          if (!passwordMatch) {
            return res.json({
              success: false,
              errors: [
                'Invalid Email or Password'
              ]
            })
          }

          const jwt_ttl: any = process.env.JWT_TTL || 60;
          const access_token = await jwt.sign({
              id: user._id
            },
            process.env.JWT_SECRET, {
              expiresIn: jwt_ttl * 60
            });

          const res_user = {
            data: {
              displayName: user.displayName,
              email: user.email,
            },
            role: user.role
          };

          return res.json({
            success: true,
            access_token,
            user: res_user
          })
        } catch (err) {
          console.log(err);
          const errors = ['Failed to login'];
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
     * GET: get auth user data
     */
    this.router.get('/user', this.authMiddleware, async (req: express.Request, res: express.Response) => {
      const user_id = req['user'].id;
      const user = await User.findById(user_id).exec();

      if (!user) {
        return res.json({
          success:false
        });
      }

      const res_user = {
        data: {
          displayName: user.displayName,
          email: user.email,
        },
        role: user.role
      };

      const jwt_ttl: any = process.env.JWT_TTL || 60;
      const access_token = await jwt.sign({
          id: user._id
        },
        process.env.JWT_SECRET, {
          expiresIn: jwt_ttl * 60
        });

      res.json({
        success: true,
        access_token,
        user: res_user
      })
    });
  }
}