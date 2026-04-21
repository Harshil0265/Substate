import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import verifyToken from '../middleware/auth.js';
import razorpayService from '../services/RazorpayService.js';

const router = express.Router();

// Get Razorpay configuration for frontend
router.get('/razorpay-config', verifyToken, async (req, res) => {
  try {
    if (!razorpayService.isConfigured()) {
      return res.status(503).json({ 
        error: 'Payment service is not configured. Please contact support.' 
      });
    }

    res.json({
      keyId: razorpayService.getKeyId(),
      currency: 'INR'
    });
  } catch (error) {
    console.error('❌ Error fetching Razorpay config:', error);
    res.status(500).json({ error: 'Failed to fetch payment configuration' });
  }
});

// Create Razorpay order for subscription
router.post('/create-order', verifyToken, async (req, res) => {
  try {
    console.log('💳 Create order request:', {
      userId: req.userId,
      userEmail: req.userEmail,
      planId: req.body.planId,
      timestamp: new Date().toISOString()
    });

    const { planId } = req.body;

    // Validate plan ID
    const validPlans = ['TRIAL', 'PROFESSIONAL', 'ENTERPRISE'];
    if (!validPlans.includes(planId)) {
      console.log('❌ Invalid plan ID:', planId);
      return res.status(400).json({ 
        error: `Invalid plan. Must be one of: ${validPlans.join(', ')}` 
      });
    }

    // Get user
    const user = await User.findById(req.userId);
    if (!user) {
      console.log('❌ User not found:', req.userId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('👤 Current user subscription:', {
      currentPlan: user.subscription,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionEndDate: user.subscriptionEndDate
    });

    // Check if user is trying to downgrade or same plan
    const planHierarchy = { TRIAL: 0, BASIC: 1, PRO: 2, ENTERPRISE: 3 };
    const currentPlanLevel = planHierarchy[user.subscription] || 0;
    const newPlanLevel = planHierarchy[planId];

    // Prevent users from going back to TRIAL after upgrading to any paid plan
    if (planId === 'TRIAL' && user.subscription !== 'TRIAL') {
      console.log('❌ Cannot downgrade to trial from paid plan:', {
        from: user.subscription,
        to: planId
      });
      return res.status(400).json({ 
        error: 'Cannot downgrade to trial plan. Trial is only available for new users.' 
      });
    }

    if (newPlanLevel <= currentPlanLevel && user.subscription !== 'TRIAL') {
      console.log('❌ Invalid plan change:', {
        from: user.subscription,
        to: planId,
        fromLevel: currentPlanLevel,
        toLevel: newPlanLevel
      });
      return res.status(400).json({ 
        error: 'Cannot downgrade or select the same plan. Please contact support for downgrades.' 
      });
    }

    // Check if user already has an active subscription to the same plan
    if (user.subscription === planId && user.subscriptionStatus === 'ACTIVE') {
      console.log('❌ User already has active subscription to this plan:', planId);
      return res.status(400).json({ 
        error: `You already have an active ${planId} subscription.` 
      });
    }

    // Calculate plan details
    const planDetails = {
      TRIAL: { price: 0, duration: 14, name: 'Starter (Free Trial)', priceINR: 0 },
      PRO: { price: 10, duration: 30, name: 'Professional', priceINR: 10 },
      ENTERPRISE: { price: 20, duration: 30, name: 'Enterprise', priceINR: 20 }
    };

    const plan = planDetails[planId];
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan configuration' });
    }

    // For trial plan, just update user directly
    if (planId === 'TRIAL') {
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + plan.duration * 24 * 60 * 60 * 1000);

      user.subscription = planId;
      user.subscriptionStatus = 'ACTIVE';
      user.subscriptionStartDate = startDate;
      user.subscriptionEndDate = endDate;
      await user.save();

      console.log('✅ Trial subscription activated:', {
        planId,
        startDate,
        endDate
      });

      return res.json({
        message: 'Trial subscription activated successfully',
        isTrial: true,
        subscription: {
          plan: planId,
          status: 'ACTIVE',
          startDate,
          endDate,
          price: plan.price
        }
      });
    }

    // For paid plans, create Razorpay order
    if (!razorpayService.isConfigured()) {
      return res.status(503).json({ 
        error: 'Payment service is not configured. Please contact support.' 
      });
    }

    const paymentAmount = plan.priceINR;
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.duration * 24 * 60 * 60 * 1000);

    // Create payment record in database
    const payment = new Payment({
      userId: req.userId,
      amount: paymentAmount,
      currency: 'INR',
      status: 'PENDING',
      paymentMethod: 'RAZORPAY',
      planType: planId,
      billingPeriod: 'MONTHLY',
      description: `Subscription upgrade to ${plan.name} plan`
    });

    await payment.save();

    console.log('💳 Payment record created:', {
      paymentId: payment._id,
      amount: paymentAmount,
      plan: planId
    });

    // Create Razorpay order
    try {
      const razorpayOrder = await razorpayService.createOrder({
        amount: paymentAmount,
        currency: 'INR',
        receipt: `receipt_${payment._id}`,
        notes: {
          paymentId: payment._id.toString(),
          userId: req.userId.toString(),
          planId: planId,
          planName: plan.name,
          userEmail: user.email
        }
      });

      // Update payment record with Razorpay order ID
      payment.razorpayOrderId = razorpayOrder.id;
      await payment.save();

      console.log('✅ Razorpay order created:', {
        orderId: razorpayOrder.id,
        paymentId: payment._id
      });

      // Return order details for frontend
      res.json({
        success: true,
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        paymentId: payment._id,
        keyId: razorpayService.getKeyId(),
        subscription: {
          plan: planId,
          planName: plan.name,
          startDate,
          endDate,
          price: plan.price,
          priceINR: plan.priceINR
        },
        user: {
          name: user.name,
          email: user.email
        }
      });

    } catch (razorpayError) {
      console.error('❌ Razorpay order creation failed:', razorpayError);
      
      // Update payment status to failed
      payment.status = 'FAILED';
      await payment.save();

      return res.status(500).json({ 
        error: 'Failed to create payment order. Please try again.' 
      });
    }

  } catch (error) {
    console.error('❌ Order creation error:', {
      message: error.message,
      stack: error.stack,
      userId: req.userId,
      planId: req.body.planId
    });
    res.status(500).json({ error: 'Failed to create order. Please try again.' });
  }
});

// Verify Razorpay payment and activate subscription
router.post('/verify-payment', verifyToken, async (req, res) => {
  try {
    console.log('🔐 Verify payment request:', {
      userId: req.userId,
      timestamp: new Date().toISOString()
    });

    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      paymentId 
    } = req.body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !paymentId) {
      return res.status(400).json({ 
        error: 'Missing required payment verification fields' 
      });
    }

    // Get payment record
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      console.log('❌ Payment record not found:', paymentId);
      return res.status(404).json({ error: 'Payment record not found' });
    }

    // Verify payment belongs to user
    if (payment.userId.toString() !== req.userId.toString()) {
      console.log('❌ Unauthorized payment access:', {
        paymentUserId: payment.userId,
        requestUserId: req.userId
      });
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Verify Razorpay signature
    const isValidSignature = razorpayService.verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });

    if (!isValidSignature) {
      console.log('❌ Invalid payment signature');
      payment.status = 'FAILED';
      await payment.save();
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    console.log('✅ Payment signature verified');

    // Fetch payment details from Razorpay
    const razorpayPayment = await razorpayService.fetchPayment(razorpay_payment_id);

    // Update payment record
    payment.status = 'COMPLETED';
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.transactionId = razorpay_payment_id;
    await payment.save();

    // Update user subscription
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const planDetails = {
      PRO: { duration: 30 },
      ENTERPRISE: { duration: 30 }
    };

    const plan = planDetails[payment.planType];
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.duration * 24 * 60 * 60 * 1000);

    user.subscription = payment.planType;
    user.subscriptionStatus = 'ACTIVE';
    user.subscriptionStartDate = startDate;
    user.subscriptionEndDate = endDate;
    await user.save();

    console.log('✅ Subscription activated:', {
      userId: user._id,
      plan: payment.planType,
      startDate,
      endDate
    });

    res.json({
      success: true,
      message: 'Payment verified and subscription activated successfully',
      payment: {
        id: payment._id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        transactionId: payment.transactionId
      },
      subscription: {
        plan: user.subscription,
        status: user.subscriptionStatus,
        startDate: user.subscriptionStartDate,
        endDate: user.subscriptionEndDate
      }
    });

  } catch (error) {
    console.error('❌ Payment verification error:', {
      message: error.message,
      stack: error.stack,
      userId: req.userId
    });
    res.status(500).json({ error: 'Failed to verify payment. Please contact support.' });
  }
});

// Get payment status
router.get('/payment/:paymentId', verifyToken, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId);
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    if (payment.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    res.json({
      paymentId: payment._id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      plan: payment.subscriptionPlan,
      createdAt: payment.createdAt,
      paidAt: payment.paidAt,
      transactionId: payment.transactionId
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ error: 'Failed to fetch payment details' });
  }
});

// Get user's payment history
router.get('/history', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    const payments = await Payment.find({ userId: req.userId })
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Payment.countDocuments({ userId: req.userId });
    
    res.json({
      payments,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

// Cancel subscription
router.post('/cancel-subscription', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Don't allow canceling trial
    if (user.subscription === 'TRIAL') {
      return res.status(400).json({ error: 'Cannot cancel trial subscription' });
    }

    // Set subscription to expire at the end of current billing period
    user.subscriptionStatus = 'CANCELLED';
    await user.save();

    res.json({
      message: 'Subscription cancelled successfully. Access will continue until the end of your billing period.',
      subscription: {
        plan: user.subscription,
        status: 'CANCELLED',
        endDate: user.subscriptionEndDate
      }
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

export default router;