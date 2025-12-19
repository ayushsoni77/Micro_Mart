import express from 'express';
import { initiatePayment, paymentCallback, getPaymentTransactions } from '../controllers/paymentController.js';

const router = express.Router();

router.post('/initiate', initiatePayment);
router.post('/callback', paymentCallback);
router.get('/transactions/:orderId', getPaymentTransactions);

export default router;
