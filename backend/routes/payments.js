import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import verifyToken from '../middleware/auth.js';
import razorpayService from '../services/RazorpayService.js';
import receiptService from '../services/ReceiptService.js';

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
    const { page = 1, limit = 10, status = '' } = req.query;
    const skip = (page - 1) * limit;
    
    const filter = { userId: req.userId };
    if (status) filter.status = status;
    
    const payments = await Payment.find(filter)
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Payment.countDocuments(filter);
    
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

// Request refund (user)
router.post('/request-refund/:paymentId', verifyToken, async (req, res) => {
  try {
    const { reason } = req.body;
    const payment = await Payment.findById(req.params.paymentId);

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Verify payment belongs to user
    if (payment.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (payment.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Only completed payments can be refunded' });
    }

    if (payment.status === 'REFUNDED' || payment.status === 'REFUND_REQUESTED') {
      return res.status(400).json({ error: 'Refund already requested or processed' });
    }

    // Check if payment is within refund window (30 days)
    const daysSincePayment = Math.floor((Date.now() - payment.createdAt) / (1000 * 60 * 60 * 24));
    if (daysSincePayment > 30) {
      return res.status(400).json({ error: 'Refund window has expired (30 days)' });
    }

    // Update payment status
    payment.status = 'REFUND_REQUESTED';
    payment.refundReason = reason;
    payment.refundRequestedAt = new Date();
    await payment.save();

    res.json({
      message: 'Refund request submitted successfully. Our team will review it within 2-3 business days.',
      payment: {
        id: payment._id,
        status: payment.status,
        amount: payment.amount,
        refundRequestedAt: payment.refundRequestedAt
      }
    });
  } catch (error) {
    console.error('Error requesting refund:', error);
    res.status(500).json({ error: 'Failed to request refund' });
  }
});

// Retry failed payment (user)
router.post('/retry/:paymentId', verifyToken, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId);

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Verify payment belongs to user
    if (payment.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (payment.status !== 'FAILED') {
      return res.status(400).json({ error: 'Only failed payments can be retried' });
    }

    // Get user
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create new Razorpay order for retry
    if (!razorpayService.isConfigured()) {
      return res.status(503).json({ 
        error: 'Payment service is not configured. Please contact support.' 
      });
    }

    const planDetails = {
      PROFESSIONAL: { duration: 30, name: 'Professional' },
      ENTERPRISE: { duration: 30, name: 'Enterprise' }
    };

    const plan = planDetails[payment.planType];
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan type' });
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.duration * 24 * 60 * 60 * 1000);

    // Create new payment record for retry
    const newPayment = new Payment({
      userId: req.userId,
      amount: payment.amount,
      currency: payment.currency,
      status: 'PENDING',
      paymentMethod: 'RAZORPAY',
      planType: payment.planType,
      billingPeriod: payment.billingPeriod,
      description: `Retry: ${payment.description}`
    });

    await newPayment.save();

    // Create Razorpay order
    const razorpayOrder = await razorpayService.createOrder({
      amount: payment.amount,
      currency: payment.currency,
      receipt: `receipt_${newPayment._id}`,
      notes: {
        paymentId: newPayment._id.toString(),
        userId: req.userId.toString(),
        planId: payment.planType,
        planName: plan.name,
        userEmail: user.email,
        retryOf: payment._id.toString()
      }
    });

    // Update payment record with Razorpay order ID
    newPayment.razorpayOrderId = razorpayOrder.id;
    await newPayment.save();

    // Return order details for frontend
    res.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      paymentId: newPayment._id,
      keyId: razorpayService.getKeyId(),
      subscription: {
        plan: payment.planType,
        planName: plan.name,
        startDate,
        endDate
      },
      user: {
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Error retrying payment:', error);
    res.status(500).json({ error: 'Failed to retry payment' });
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

// Get admin payment analytics
router.get('/admin/analytics', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    // Get payment statistics
    const totalPayments = await Payment.countDocuments();
    const completedPayments = await Payment.countDocuments({ status: 'COMPLETED' });
    const failedPayments = await Payment.countDocuments({ status: 'FAILED' });
    const refundedPayments = await Payment.countDocuments({ status: 'REFUNDED' });
    
    // Calculate total revenue
    const revenueData = await Payment.aggregate([
      { $match: { status: 'COMPLETED' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = revenueData[0]?.total || 0;

    // Get monthly revenue trend
    const monthlyRevenue = await Payment.aggregate([
      { $match: { status: 'COMPLETED' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    // Get subscription plan distribution
    const planDistribution = await Payment.aggregate([
      { $match: { status: 'COMPLETED' } },
      {
        $group: {
          _id: '$planType',
          count: { $sum: 1 },
          revenue: { $sum: '$amount' }
        }
      }
    ]);

    // Get payment method distribution
    const paymentMethods = await Payment.aggregate([
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          revenue: { $sum: '$amount' }
        }
      }
    ]);

    // Get recent failed payments
    const failedPaymentsList = await Payment.find({ status: 'FAILED' })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name email');

    // Get subscription churn rate
    const activeSubscriptions = await User.countDocuments({ subscriptionStatus: 'ACTIVE' });
    const cancelledSubscriptions = await User.countDocuments({ subscriptionStatus: 'CANCELLED' });
    const churnRate = activeSubscriptions > 0 ? (cancelledSubscriptions / (activeSubscriptions + cancelledSubscriptions)) * 100 : 0;

    res.json({
      summary: {
        totalPayments,
        completedPayments,
        failedPayments,
        refundedPayments,
        totalRevenue: totalRevenue / 100, // Convert from paise to rupees
        successRate: totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0,
        failureRate: totalPayments > 0 ? (failedPayments / totalPayments) * 100 : 0
      },
      monthlyRevenue: monthlyRevenue.map(m => ({
        month: `${m._id.month}/${m._id.year}`,
        revenue: m.revenue / 100,
        transactions: m.count
      })),
      planDistribution,
      paymentMethods,
      failedPayments: failedPaymentsList,
      subscriptionMetrics: {
        activeSubscriptions,
        cancelledSubscriptions,
        churnRate: churnRate.toFixed(2)
      }
    });
  } catch (error) {
    console.error('Error fetching payment analytics:', error);
    res.status(500).json({ error: 'Failed to fetch payment analytics' });
  }
});

// Get all payments (admin)
router.get('/admin/all', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    const { page = 1, limit = 20, status = '', planType = '' } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) filter.status = status;
    if (planType) filter.planType = planType;

    const payments = await Payment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email subscription');

    const total = await Payment.countDocuments(filter);

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
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Process refund (admin)
router.post('/admin/refund/:paymentId', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    const adminUser = await User.findById(req.userId);
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    const { action, adminNotes, amount } = req.body; // action: 'approve' or 'reject'
    const payment = await Payment.findById(req.params.paymentId).populate('userId', 'name email');

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.status !== 'COMPLETED' && payment.status !== 'REFUND_REQUESTED') {
      return res.status(400).json({ error: 'Only completed or refund-requested payments can be processed' });
    }

    if (action === 'approve') {
      // Process refund through Razorpay
      if (!payment.razorpayPaymentId) {
        return res.status(400).json({ error: 'No Razorpay payment ID found for this payment' });
      }

      try {
        const refundAmount = amount || payment.amount;
        const razorpayRefund = await razorpayService.createRefund(
          payment.razorpayPaymentId,
          refundAmount,
          {
            reason: payment.refundReason || 'Customer request',
            adminNotes: adminNotes || '',
            processedBy: adminUser.email
          }
        );

        // Update payment record
        payment.status = 'REFUNDED';
        payment.refundedAt = new Date();
        payment.refundedBy = req.userId;
        payment.razorpayRefundId = razorpayRefund.id;
        if (adminNotes) payment.refundReason = `${payment.refundReason || ''}\nAdmin Notes: ${adminNotes}`;
        await payment.save();

        // Update user subscription if needed
        const user = await User.findById(payment.userId);
        if (user && user.subscription === payment.planType) {
          user.subscriptionStatus = 'CANCELLED';
          await user.save();
        }

        console.log('✅ Refund processed successfully:', {
          paymentId: payment._id,
          razorpayRefundId: razorpayRefund.id,
          amount: refundAmount
        });

        res.json({
          message: 'Refund approved and processed successfully',
          payment: {
            id: payment._id,
            status: payment.status,
            amount: payment.amount,
            refundedAt: payment.refundedAt,
            razorpayRefundId: razorpayRefund.id,
            refundStatus: razorpayRefund.status,
            user: {
              name: payment.userId.name,
              email: payment.userId.email
            }
          }
        });
      } catch (razorpayError) {
        console.error('❌ Razorpay refund failed:', razorpayError);
        return res.status(500).json({ 
          error: `Failed to process refund through Razorpay: ${razorpayError.message}` 
        });
      }
    } else if (action === 'reject') {
      // Reject refund request
      payment.status = 'COMPLETED';
      payment.refundReason = `${payment.refundReason || ''}\nAdmin Rejection: ${adminNotes || 'Refund request rejected'}`;
      payment.refundRequestedAt = null;
      await payment.save();

      res.json({
        message: 'Refund request rejected',
        payment: {
          id: payment._id,
          status: payment.status
        }
      });
    } else {
      return res.status(400).json({ error: 'Invalid action. Use "approve" or "reject"' });
    }
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

// Get refund status (user)
router.get('/refund-status/:paymentId', verifyToken, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId);

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Verify payment belongs to user
    if (payment.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // If refund was processed through Razorpay, fetch latest status
    if (payment.razorpayRefundId && razorpayService.isConfigured()) {
      try {
        const razorpayRefund = await razorpayService.fetchRefund(payment.razorpayRefundId);
        
        res.json({
          paymentId: payment._id,
          status: payment.status,
          refundStatus: razorpayRefund.status,
          amount: payment.amount,
          refundAmount: razorpayRefund.amount / 100,
          refundRequestedAt: payment.refundRequestedAt,
          refundedAt: payment.refundedAt,
          refundReason: payment.refundReason,
          razorpayRefundId: payment.razorpayRefundId,
          speedProcessed: razorpayRefund.speed_processed
        });
      } catch (razorpayError) {
        console.error('Error fetching Razorpay refund status:', razorpayError);
        // Fall back to database status
        res.json({
          paymentId: payment._id,
          status: payment.status,
          amount: payment.amount,
          refundRequestedAt: payment.refundRequestedAt,
          refundedAt: payment.refundedAt,
          refundReason: payment.refundReason
        });
      }
    } else {
      res.json({
        paymentId: payment._id,
        status: payment.status,
        amount: payment.amount,
        refundRequestedAt: payment.refundRequestedAt,
        refundedAt: payment.refundedAt,
        refundReason: payment.refundReason
      });
    }
  } catch (error) {
    console.error('Error fetching refund status:', error);
    res.status(500).json({ error: 'Failed to fetch refund status' });
  }
});

// Get refund requests (admin)
router.get('/admin/refund-requests', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    const adminUser = await User.findById(req.userId);
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    const refundRequests = await Payment.find({ status: 'REFUND_REQUESTED' })
      .sort({ refundRequestedAt: -1 })
      .populate('userId', 'name email subscription')
      .limit(50);

    res.json({
      refundRequests,
      total: refundRequests.length
    });
  } catch (error) {
    console.error('Error fetching refund requests:', error);
    res.status(500).json({ error: 'Failed to fetch refund requests' });
  }
});

// Download receipt/invoice for a payment
router.get('/receipt/:paymentId', verifyToken, async (req, res) => {
  try {
    console.log('📄 Receipt download request:', {
      userId: req.userId,
      paymentId: req.params.paymentId,
      timestamp: new Date().toISOString()
    });

    const payment = await Payment.findById(req.params.paymentId);

    if (!payment) {
      console.log('❌ Payment not found:', req.params.paymentId);
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Verify payment belongs to user (or user is admin)
    const user = await User.findById(req.userId);
    const isAdmin = user && user.role === 'ADMIN';
    const isOwner = payment.userId.toString() === req.userId.toString();

    if (!isOwner && !isAdmin) {
      console.log('❌ Unauthorized receipt access:', {
        paymentUserId: payment.userId,
        requestUserId: req.userId
      });
      return res.status(403).json({ error: 'Unauthorized access to this receipt' });
    }

    // Only allow receipt download for completed or refunded payments
    if (payment.status !== 'COMPLETED' && payment.status !== 'REFUNDED') {
      console.log('❌ Receipt not available for payment status:', payment.status);
      return res.status(400).json({ 
        error: 'Receipt is only available for completed or refunded payments' 
      });
    }

    // Get payment owner details
    const paymentUser = await User.findById(payment.userId);
    if (!paymentUser) {
      return res.status(404).json({ error: 'Payment user not found' });
    }

    console.log('✅ Generating receipt for payment:', {
      paymentId: payment._id,
      invoiceNumber: payment.invoiceNumber,
      amount: payment.amount,
      plan: payment.planType
    });

    // Generate PDF receipt
    const pdfBuffer = await receiptService.generateReceipt(payment, paymentUser);

    // Set response headers for PDF download
    const invoiceNumber = payment.invoiceNumber || `INV-${payment._id.toString().slice(-8).toUpperCase()}`;
    const filename = `${invoiceNumber}_SubState_Receipt.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    console.log('✅ Receipt generated successfully:', {
      filename,
      size: `${(pdfBuffer.length / 1024).toFixed(2)} KB`
    });

    res.send(pdfBuffer);

  } catch (error) {
    console.error('❌ Receipt generation error:', {
      message: error.message,
      stack: error.stack,
      userId: req.userId,
      paymentId: req.params.paymentId
    });
    res.status(500).json({ 
      error: 'Failed to generate receipt. Please try again or contact support.' 
    });
  }
});

export default router;