import * as express from 'express';
import * as logger from 'morgan';
import * as cors from 'cors';
import AuthController from './controllers/auth';

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
  }

  configureControllers() {
    this.app.use('/api/auth', (new AuthController()).router);
  }
}

export default Server;