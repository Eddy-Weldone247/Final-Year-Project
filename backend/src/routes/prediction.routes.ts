import { Router } from 'express';

import * as predictionController from '../controllers/prediction.controller';
import { authenticate } from '../middleware/auth.middleware';

export const predictionRouter = Router();

// All prediction routes require authentication.
predictionRouter.use(authenticate);

// Generate (and store) fresh predictions from the ML service.
predictionRouter.post('/forecast', predictionController.forecastSpending); // ?days=7|30
predictionRouter.post('/category', predictionController.forecastCategory); // ?days=30
predictionRouter.post('/train', predictionController.train); // model metrics

// Read stored prediction results.
predictionRouter.get('/', predictionController.history); // ?kind=SPENDING|CATEGORY|MODEL
predictionRouter.get('/latest', predictionController.latest); // ?kind=&days=
