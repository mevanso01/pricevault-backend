import * as express from 'express';
import * as logger from 'morgan';
import * as cors from 'cors';
import * as expressJwt from 'express-jwt';
import AuthController from './controllers/auth';
import ProfileController from './controllers/profile';
import SubmissionController from './controllers/submission';
import AssetController from './controllers/asset';
import InstrumentTypeController from './controllers/instrumentType';
import TradeController from './controllers/trade';
import ResultController from './controllers/result';

class Server {
  app: any = null;

  constructor() {
    this.configureServer();
    this.configureControllers();
  }

  configureServer() {
    this.app = express();

    const WEBAPP_SOURCE = process.env.WEBAPP_SOURCE || '';
    const corsOptions = {
      "origin": [...WEBAPP_SOURCE.split(","), "http://localhost:3000"],
      "methods": "*",
      "preflightContinue": false,
      "optionsSuccessStatus": 204
    }

    this.app.use(cors(corsOptions));
    this.app.use(logger('dev'))
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));

    this.app.get('/', async (req, res) => {
      res.send('OK');
    })

    this.configureControllers();

    // error handler
    this.app.use(function (err, req, res, next) {
      // set locals, only providing error in development
      res.locals.message = err.message
      res.locals.error = req.app.get('env') === 'development' ? err : {}

      // render the error page
      res.status(err.status || 500)
      res.send({
        error: err.toString()
      })
    })
  }

  configureControllers() {
    const authMiddleware = expressJwt({
      secret: process.env.JWT_SECRET,
      credentialsRequired: true,
      algorithms: ['HS256'],
      getToken: function fromHeaderOrQuerystring(req) {
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
          return req.headers.authorization.split(' ')[1];
        } else if (req.query && req.query.token) {
          return req.query.token;
        }
        return null;
      }
    });

    this.app.use('/api/auth', (new AuthController(authMiddleware)).router);
    this.app.use('/api/profile', (new ProfileController(authMiddleware)).router);
    this.app.use('/api/submission', (new SubmissionController(authMiddleware)).router);
    this.app.use('/api/asset', (new AssetController(authMiddleware)).router);
    this.app.use('/api/instrument', (new InstrumentTypeController(authMiddleware)).router);
    this.app.use('/api/trade', (new TradeController(authMiddleware)).router);
    this.app.use('/api/result', (new ResultController(authMiddleware)).router);
  }
}

export default Server;