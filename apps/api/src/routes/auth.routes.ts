import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const controller = new AuthController();

router.post('/register', controller.register.bind(controller));
router.post('/login', controller.login.bind(controller));
router.post('/logout', controller.logout.bind(controller));
router.post('/refresh-token', controller.refreshToken.bind(controller));
router.post('/forgot-password', controller.forgotPassword.bind(controller));
router.post('/reset-password', controller.resetPassword.bind(controller));
router.get('/verify-email', controller.verifyEmail.bind(controller));
router.post('/verify-email', controller.verifyEmail.bind(controller));

// Admin/user management
router.get('/users', authenticate, authorize(['ADMIN', 'ACCOUNTANT']), controller.listUsers.bind(controller));
router.patch('/users/:id/approve', authenticate, authorize(['ADMIN']), controller.approveUser.bind(controller));
router.delete('/users/:id', authenticate, authorize(['ADMIN']), controller.deletePendingUser.bind(controller));

export default router;
