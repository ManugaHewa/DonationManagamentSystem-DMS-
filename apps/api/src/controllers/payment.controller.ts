import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';

const paymentService = new PaymentService();

export class PaymentController {
  async processCard(req: Request, res: Response) {
    try {
      const result = await paymentService.processCardPayment(req.body);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Payment failed' });
    }
  }

  async simulate(req: Request, res: Response) {
    try {
      const result = await paymentService.processCardPayment({ ...req.body, mode: 'test' });
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Simulation failed' });
    }
  }
}
