import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import verifyToken from '../middleware/auth.js';

const router = express.Router();

// Create subscription (upgrade plan)
router.post('/create-subscription', verifyToken, async (req, res) => {
  try {
    console.log('💳 Create subscription request:', {
      userId: req.userId,
      userEmail: req.userEmail,
      planId: req.body.planId,
      timestamp: new Date().toISOString()
    });

    const { planId } = req.body;

    // Validate plan ID
    const validPlans = ['TRIAL', 'PRO', 'ENTERPRISE'];
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
      TRIAL: { price: 0, duration: 14, name: 'Starter (Free Trial)' },
      PRO: { price: 10, duration: 30, name: 'Professional' },
      ENTERPRISE: { price: 20, duration: 30, name: 'Enterprise' }
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
        subscription: {
          plan: planId,
          status: 'ACTIVE',
          startDate,
          endDate,
          price: plan.price
        }
      });
    }

    // For paid plans, create payment record and simulate payment processing
    const paymentAmount = plan.price;
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.duration * 24 * 60 * 60 * 1000);

    // Create payment record
    const payment = new Payment({
      userId: req.userId,
      amount: paymentAmount,
      currency: 'USD',
      status: 'PENDING',
      paymentMethod: 'CARD', // In real app, this would come from payment gateway
      subscriptionPlan: planId,
      billingPeriod: 'MONTHLY',
      description: `Subscription upgrade to ${plan.name} plan`,
      metadata: {
        planId,
        planName: plan.name,
        billingCycle: 'monthly'
      }
    });

    await payment.save();

    console.log('💳 Payment record created:', {
      paymentId: payment._id,
      amount: paymentAmount,
      plan: planId
    });

    // Simulate payment processing (in real app, integrate with Stripe/Razorpay/etc.)
    // For demo purposes, we'll mark it as successful immediately
    setTimeout(async () => {
      try {
        // Update payment status
        payment.status = 'COMPLETED';
        payment.paidAt = new Date();
        payment.transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await payment.save();

        // Update user subscription
        user.subscription = planId;
        user.subscriptionStatus = 'ACTIVE';
        user.subscriptionStartDate = startDate;
        user.subscriptionEndDate = endDate;
        await user.save();

        console.log('✅ Payment processed and subscription updated:', {
          paymentId: payment._id,
          transactionId: payment.transactionId,
          newPlan: planId
        });
      } catch (error) {
        console.error('❌ Error processing payment:', error);
      }
    }, 1000); // Simulate 1 second processing time

    // Return payment initiation response
    res.json({
      message: 'Payment initiated successfully',
      paymentId: payment._id,
      amount: paymentAmount,
      currency: 'USD',
      status: 'PENDING',
      subscription: {
        plan: planId,
        startDate,
        endDate,
        price: plan.price
      },
      // In real app, you'd return payment gateway URL or token
      paymentUrl: `/payment-success?paymentId=${payment._id}`,
      estimatedProcessingTime: '1-2 seconds'
    });

  } catch (error) {
    console.error('❌ Subscription creation error:', {
      message: error.message,
      stack: error.stack,
      userId: req.userId,
      planId: req.body.planId
    });
    res.status(500).json({ error: 'Failed to create subscription. Please try again.' });
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