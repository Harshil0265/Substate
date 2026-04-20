import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

class RazorpayService {
  constructor() {
    this.razorpay = null;
    this.initialize();
  }

  initialize() {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.warn('⚠️  Razorpay credentials not configured. Payment processing will be disabled.');
      return;
    }

    try {
      this.razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      });
      console.log('✅ Razorpay initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Razorpay:', error.message);
      this.razorpay = null;
    }
  }

  /**
   * Check if Razorpay is properly configured
   */
  isConfigured() {
    return this.razorpay !== null;
  }

  /**
   * Create a Razorpay order
   * @param {Object} options - Order options
   * @param {number} options.amount - Amount in INR (will be converted to paise)
   * @param {string} options.currency - Currency code (default: INR)
   * @param {string} options.receipt - Receipt ID
   * @param {Object} options.notes - Additional notes
   * @returns {Promise<Object>} Razorpay order object
   */
  async createOrder({ amount, currency = 'INR', receipt, notes = {} }) {
    if (!this.isConfigured()) {
      throw new Error('Razorpay is not configured. Please check your API keys.');
    }

    try {
      // Convert amount to paise (Razorpay expects amount in smallest currency unit)
      const amountInPaise = Math.round(amount * 100);

      const orderOptions = {
        amount: amountInPaise,
        currency: currency,
        receipt: receipt,
        notes: notes
      };

      console.log('📝 Creating Razorpay order:', {
        amount: amount,
        amountInPaise: amountInPaise,
        currency: currency,
        receipt: receipt
      });

      const order = await this.razorpay.orders.create(orderOptions);
      
      console.log('✅ Razorpay order created:', {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        status: order.status
      });

      return order;
    } catch (error) {
      console.error('❌ Razorpay order creation failed:', error);
      throw new Error(`Failed to create Razorpay order: ${error.message}`);
    }
  }

  /**
   * Verify Razorpay payment signature
   * @param {Object} params - Payment verification params
   * @param {string} params.razorpay_order_id - Order ID
   * @param {string} params.razorpay_payment_id - Payment ID
   * @param {string} params.razorpay_signature - Payment signature
   * @returns {boolean} True if signature is valid
   */
  verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    if (!this.isConfigured()) {
      throw new Error('Razorpay is not configured. Please check your API keys.');
    }

    try {
      // Create signature string
      const signatureString = `${razorpay_order_id}|${razorpay_payment_id}`;
      
      // Generate expected signature
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(signatureString)
        .digest('hex');

      console.log('🔐 Verifying payment signature:', {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signatureMatch: expectedSignature === razorpay_signature
      });

      return expectedSignature === razorpay_signature;
    } catch (error) {
      console.error('❌ Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Fetch payment details from Razorpay
   * @param {string} paymentId - Razorpay payment ID
   * @returns {Promise<Object>} Payment details
   */
  async fetchPayment(paymentId) {
    if (!this.isConfigured()) {
      throw new Error('Razorpay is not configured. Please check your API keys.');
    }

    try {
      const payment = await this.razorpay.payments.fetch(paymentId);
      console.log('✅ Payment fetched:', {
        paymentId: payment.id,
        status: payment.status,
        amount: payment.amount / 100,
        method: payment.method
      });
      return payment;
    } catch (error) {
      console.error('❌ Failed to fetch payment:', error);
      throw new Error(`Failed to fetch payment: ${error.message}`);
    }
  }

  /**
   * Fetch order details from Razorpay
   * @param {string} orderId - Razorpay order ID
   * @returns {Promise<Object>} Order details
   */
  async fetchOrder(orderId) {
    if (!this.isConfigured()) {
      throw new Error('Razorpay is not configured. Please check your API keys.');
    }

    try {
      const order = await this.razorpay.orders.fetch(orderId);
      console.log('✅ Order fetched:', {
        orderId: order.id,
        status: order.status,
        amount: order.amount / 100
      });
      return order;
    } catch (error) {
      console.error('❌ Failed to fetch order:', error);
      throw new Error(`Failed to fetch order: ${error.message}`);
    }
  }

  /**
   * Create a refund
   * @param {string} paymentId - Razorpay payment ID
   * @param {number} amount - Amount to refund in INR (optional, full refund if not provided)
   * @returns {Promise<Object>} Refund details
   */
  async createRefund(paymentId, amount = null) {
    if (!this.isConfigured()) {
      throw new Error('Razorpay is not configured. Please check your API keys.');
    }

    try {
      const refundOptions = {};
      if (amount) {
        refundOptions.amount = Math.round(amount * 100); // Convert to paise
      }

      const refund = await this.razorpay.payments.refund(paymentId, refundOptions);
      
      console.log('✅ Refund created:', {
        refundId: refund.id,
        paymentId: refund.payment_id,
        amount: refund.amount / 100,
        status: refund.status
      });

      return refund;
    } catch (error) {
      console.error('❌ Refund creation failed:', error);
      throw new Error(`Failed to create refund: ${error.message}`);
    }
  }

  /**
   * Get Razorpay key ID for frontend
   * @returns {string} Razorpay key ID
   */
  getKeyId() {
    return process.env.RAZORPAY_KEY_ID;
  }
}

// Export singleton instance
const razorpayService = new RazorpayService();
export default razorpayService;
