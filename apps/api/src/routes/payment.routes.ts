import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate, requireApprovedUser } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { cardPaymentSchema } from '../validators/payment.validator';

const router = Router();
const controller = new PaymentController();

router.use(authenticate);
router.use(requireApprovedUser);

router.post('/card/process', validate(cardPaymentSchema), (req, res) => controller.processCard(req, res));
router.post('/card/simulate', validate(cardPaymentSchema), (req, res) => controller.simulate(req, res));

export default router;
