import PaymentAttempt from '../models/PaymentAttempt.js';
import { v4 as uuidv4 } from 'uuid';

class PaymentTrackingService {
  
  /**
   * Track payment initiation
   */
  static async trackPaymentInitiation(userId, planDetails, requestInfo = {}) {
    try {
      const sessionId = uuidv4();
      
      const attempt = new PaymentAttempt({
        userId,
        sessionId,
        planType: planDetails.planType,
        billingPeriod: planDetails.billingPeriod,
        amount: planDetails.amount,
        originalAmount: planDetails.originalAmount,
        currency: planDetails.currency || 'INR',
        coupon: planDetails.coupon,
        attemptType: 'INITIATED',
        paymentMethod: planDetails.paymentMethod || 'RAZORPAY',
        razorpayOrderId: planDetails.razorpayOrderId,
        userAgent: requestInfo.userAgent,
        ipAddress: requestInfo.ipAddress,
        referrer: requestInfo.referrer,
        metadata: {
          timestamp: new Date(),
          source: 'payment_initiation',
          ...planDetails.metadata
        }
      });

      await attempt.save();
      
      console.log('📊 Payment initiation tracked:', {
        sessionId,
        userId,
        planType: planDetails.planType,
        amount: planDetails.amount
      });

      return { sessionId, attemptId: attempt._id };
    } catch (error) {
      console.error('❌ Error tracking payment initiation:', error);
      return null;
    }
  }

  /**
   * Track payment cancellation
   */
  static async trackPaymentCancellation(userId, sessionId, cancellationDetails = {}) {
    try {
      const attempt = new PaymentAttempt({
        userId,
        sessionId: sessionId || uuidv4(),
        planType: cancellationDetails.planType || 'PROFESSIONAL',
        billingPeriod: cancellationDetails.billingPeriod || 'MONTHLY',
        amount: cancellationDetails.amount || 0,
        originalAmount: cancellationDetails.originalAmount,
        currency: cancellationDetails.currency || 'INR',
        coupon: cancellationDetails.coupon,
        attemptType: 'CANCELLED',
        paymentMethod: cancellationDetails.paymentMethod || 'RAZORPAY',
        razorpayOrderId: cancellationDetails.razorpayOrderId,
        cancellationReason: cancellationDetails.reason || 'USER_CANCELLED',
        cancellationStage: cancellationDetails.stage || 'PAYMENT_GATEWAY',
        userAgent: cancellationDetails.userAgent,
        ipAddress: cancellationDetails.ipAddress,
        referrer: cancellationDetails.referrer,
        timeSpent: cancellationDetails.timeSpent,
        metadata: {
          timestamp: new Date(),
          source: 'payment_cancellation',
          returnUrl: cancellationDetails.returnUrl,
          errorMessage: cancellationDetails.errorMessage,
          ...cancellationDetails.metadata
        }
      });

      await attempt.save();
      
      console.log('📊 Payment cancellation tracked:', {
        sessionId,
        userId,
        reason: cancellationDetails.reason,
        stage: cancellationDetails.stage,
        timeSpent: cancellationDetails.timeSpent
      });

      return attempt._id;
    } catch (error) {
      console.error('❌ Error tracking payment cancellation:', error);
      return null;
    }
  }

  /**
   * Track payment failure
   */
  static async trackPaymentFailure(userId, sessionId, failureDetails = {}) {
    try {
      const attempt = new PaymentAttempt({
        userId,
        sessionId: sessionId || uuidv4(),
        planType: failureDetails.planType || 'PROFESSIONAL',
        billingPeriod: failureDetails.billingPeriod || 'MONTHLY',
        amount: failureDetails.amount || 0,
        originalAmount: failureDetails.originalAmount,
        currency: failureDetails.currency || 'INR',
        coupon: failureDetails.coupon,
        attemptType: 'FAILED',
        paymentMethod: failureDetails.paymentMethod || 'RAZORPAY',
        razorpayOrderId: failureDetails.razorpayOrderId,
        razorpayPaymentId: failureDetails.razorpayPaymentId,
        cancellationReason: failureDetails.reason || 'PAYMENT_FAILED',
        cancellationStage: failureDetails.stage || 'PROCESSING',
        userAgent: failureDetails.userAgent,
        ipAddress: failureDetails.ipAddress,
        referrer: failureDetails.referrer,
        timeSpent: failureDetails.timeSpent,
        metadata: {
          timestamp: new Date(),
          source: 'payment_failure',
          errorCode: failureDetails.errorCode,
          errorMessage: failureDetails.errorMessage,
          gatewayResponse: failureDetails.gatewayResponse,
          ...failureDetails.metadata
        }
      });

      await attempt.save();
      
      console.log('📊 Payment failure tracked:', {
        sessionId,
        userId,
        reason: failureDetails.reason,
        errorCode: failureDetails.errorCode
      });

      return attempt._id;
    } catch (error) {
      console.error('❌ Error tracking payment failure:', error);
      return null;
    }
  }

  /**
   * Track payment completion
   */
  static async trackPaymentCompletion(userId, sessionId, completionDetails = {}) {
    try {
      const attempt = new PaymentAttempt({
        userId,
        sessionId: sessionId || uuidv4(),
        planType: completionDetails.planType,
        billingPeriod: completionDetails.billingPeriod,
        amount: completionDetails.amount,
        originalAmount: completionDetails.originalAmount,
        currency: completionDetails.currency || 'INR',
        coupon: completionDetails.coupon,
        attemptType: 'COMPLETED',
        paymentMethod: completionDetails.paymentMethod || 'RAZORPAY',
        razorpayOrderId: completionDetails.razorpayOrderId,
        razorpayPaymentId: completionDetails.razorpayPaymentId,
        userAgent: completionDetails.userAgent,
        ipAddress: completionDetails.ipAddress,
        referrer: completionDetails.referrer,
        timeSpent: completionDetails.timeSpent,
        metadata: {
          timestamp: new Date(),
          source: 'payment_completion',
          paymentId: completionDetails.paymentId,
          transactionId: completionDetails.transactionId,
          ...completionDetails.metadata
        }
      });

      await attempt.save();
      
      console.log('📊 Payment completion tracked:', {
        sessionId,
        userId,
        planType: completionDetails.planType,
        amount: completionDetails.amount
      });

      return attempt._id;
    } catch (error) {
      console.error('❌ Error tracking payment completion:', error);
      return null;
    }
  }

  /**
   * Get payment analytics for admin
   */
  static async getPaymentAnalytics(dateRange = {}) {
    try {
      const conversionStats = await PaymentAttempt.getConversionRate(dateRange);
      const cancellationBreakdown = await PaymentAttempt.getCancellationBreakdown(dateRange);
      
      // Get plan-wise analytics
      const planAnalytics = await PaymentAttempt.aggregate([
        {
          $match: {
            ...(dateRange.startDate && { createdAt: { $gte: new Date(dateRange.startDate) } }),
            ...(dateRange.endDate && { createdAt: { $lte: new Date(dateRange.endDate) } })
          }
        },
        {
          $group: {
            _id: {
              planType: '$planType',
              attemptType: '$attemptType'
            },
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        },
        {
          $group: {
            _id: '$_id.planType',
            attempts: {
              $push: {
                type: '$_id.attemptType',
                count: '$count',
                totalAmount: '$totalAmount'
              }
            }
          }
        }
      ]);

      // Get recent cancellations for admin review
      const recentCancellations = await PaymentAttempt.find({
        attemptType: 'CANCELLED',
        ...(dateRange.startDate && { createdAt: { $gte: new Date(dateRange.startDate) } }),
        ...(dateRange.endDate && { createdAt: { $lte: new Date(dateRange.endDate) } })
      })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);

      return {
        conversionStats,
        cancellationBreakdown,
        planAnalytics,
        recentCancellations: recentCancellations.map(attempt => ({
          id: attempt._id,
          user: attempt.userId ? {
            id: attempt.userId._id,
            name: attempt.userId.name,
            email: attempt.userId.email
          } : {
            id: attempt.userId,
            name: 'Unknown User',
            email: 'unknown@example.com'
          },
          planType: attempt.planType,
          billingPeriod: attempt.billingPeriod,
          amount: attempt.amount,
          cancellationReason: attempt.cancellationReason,
          cancellationStage: attempt.cancellationStage,
          timeSpent: attempt.timeSpent,
          createdAt: attempt.createdAt,
          metadata: attempt.metadata
        }))
      };
    } catch (error) {
      console.error('❌ Error getting payment analytics:', error);
      throw error;
    }
  }

  /**
   * Get user's payment attempt history
   */
  static async getUserPaymentAttempts(userId, limit = 20) {
    try {
      const attempts = await PaymentAttempt.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit);

      return attempts;
    } catch (error) {
      console.error('❌ Error getting user payment attempts:', error);
      throw error;
    }
  }

  /**
   * Extract request info from Express request
   */
  static extractRequestInfo(req) {
    return {
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip || req.connection.remoteAddress,
      referrer: req.get('Referer') || req.get('Referrer')
    };
  }
}

export default PaymentTrackingService;