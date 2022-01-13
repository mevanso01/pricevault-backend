import * as express from 'express';
import { body, validationResult } from 'express-validator';
import * as Mongoose from 'mongoose';

import Submission from "../../models/Submission";

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
                    var items = JSON.parse(req.body.items);
                    // Add userId field into each item
                    var payload = items.map(obj=> ({ ...obj, userId: req.user.id }));
                    
                    await Submission.insertMany(payload, {ordered: false});
                    
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
         * GET: get all submissions
         */
        this.router.get('/', this.authMiddleware, async (req: express.Request, res: express.Response) => {
            const submission = await Submission.find().exec();

            if (!submission) {
                return res.json({
                    success:false,
                    items: []
                });
            }

            res.json({
                success: true,
                items: submission
            })
        });
    }
}