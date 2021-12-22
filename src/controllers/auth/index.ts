import * as express from 'express';

export default class AuthController {
  router: any = null;

  constructor() {
    this.router = express.Router();

    this.configure();
  }

  configure() {
    this.router.post('/register', (req, res) => {
      res.json({
        success: false,
        errors: [
          'Failed to create user'
        ]
      })
    });

    this.router.post('/login', (req, res) => {
      res.json({
        success: false,
        errors: [
          'Invalid Email or Password'
        ]
      })
    });
  }
}