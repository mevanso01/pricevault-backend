import * as express from 'express';
import AuthController from './controllers/auth';

class Server {
  app: any = null;

  constructor() {
    this.configureServer();
    this.configureControllers();
  }

  configureServer() {
    this.app = express();

    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));

    this.app.get('/', async (req, res) => {
      res.send('OK');
    })
  }

  configureControllers() {
    new AuthController(this.app);
  }
}

export default Server;