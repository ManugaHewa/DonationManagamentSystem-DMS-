import { Router } from 'express';
import { AlokaPujaController } from '../controllers/aloka-puja.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createAlokaPujaSchema, updateAlokaPujaSchema } from '../validators/aloka-puja.validator';

const router = Router();
const alokaPujaController = new AlokaPujaController();

// All routes require authentication
router.use(authenticate);

// Donor routes - manage own Aloka Pujas
router.get('/my-pujas', alokaPujaController.getMyPujas);
router.post('/', validate(createAlokaPujaSchema), alokaPujaController.create);
router.patch('/:id', validate(updateAlokaPujaSchema), alokaPujaController.update);
router.delete('/:id', alokaPujaController.delete);

// Admin/Volunteer routes - view all Aloka Pujas
router.get('/', authorize(['ADMIN', 'ACCOUNTANT', 'VOLUNTEER']), alokaPujaController.getAll);
router.get('/:id', alokaPujaController.getById);

// Upcoming pujas for staff notifications
router.get('/upcoming/:days', authorize(['ADMIN', 'VOLUNTEER']), alokaPujaController.getUpcoming);

export default router;