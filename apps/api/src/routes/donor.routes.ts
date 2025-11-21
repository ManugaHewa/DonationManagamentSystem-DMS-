import { Router } from 'express';
import { DonorController } from '../controllers/donor.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createDonorSchema, updateDonorSchema } from '../validators/donor.validator';

const router = Router();
const donorController = new DonorController();

// Protected routes - all require authentication
router.use(authenticate);

// Get current donor profile (for logged-in donors)
router.get('/me', donorController.getMyProfile);
router.patch('/me', validate(updateDonorSchema), donorController.updateMyProfile);

// Admin/Accountant routes
router.get('/', authorize(['ADMIN', 'ACCOUNTANT', 'VOLUNTEER']), donorController.getAll);
router.get('/:id', authorize(['ADMIN', 'ACCOUNTANT', 'VOLUNTEER']), donorController.getById);
router.post('/', authorize(['ADMIN', 'ACCOUNTANT']), validate(createDonorSchema), donorController.create);
router.patch('/:id', authorize(['ADMIN', 'ACCOUNTANT']), validate(updateDonorSchema), donorController.update);
router.delete('/:id', authorize(['ADMIN']), donorController.delete);

// Family member management
router.get('/:id/family-members', donorController.getFamilyMembers);
router.post('/:id/family-members', validate(createDonorSchema), donorController.addFamilyMember);
router.patch('/family-members/:memberId', donorController.updateFamilyMember);
router.delete('/family-members/:memberId', donorController.deleteFamilyMember);

export default router;