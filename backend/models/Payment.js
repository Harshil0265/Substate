import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  invoiceNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  amount: {
    type: Number,
    required: true
  },
  originalAmount: {
    type: Number,
    default: null // Original plan price before discount
  },
  currency: {
    type: String,
    default: 'INR'
  },
  coupon: {
    code: String,
    discountAmount: Number,
    couponId: mongoose.Schema.Types.ObjectId
  },
  paymentMethod: {
    type: String,
    enum: ['RAZORPAY', 'STRIPE', 'DIRECT', 'FREE'],
    default: 'RAZORPAY'
  },
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'REFUND_REQUESTED', 'CANCELLED'],
    default: 'PENDING'
  },
  planType: {
    type: String,
    enum: ['TRIAL', 'PROFESSIONAL', 'ENTERPRISE'],
    default: 'TRIAL'
  },
  billingPeriod: {
    type: String,
    enum: ['MONTHLY', 'YEARLY'],
    default: 'MONTHLY'
  },
  description: String,
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpayRefundId: String,
  failureReason: String,
  refundReason: String,
  refundRequestedAt: Date,
  refundedAt: Date,
  refundedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  refundStatus: {
    type: String,
    enum: ['PENDING', 'PROCESSED', 'FAILED'],
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for efficient queries
paymentSchema.index({ userId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });

// Pre-save hook to generate invoice number
paymentSchema.pre('save', async function() {
  if (this.isNew && !this.invoiceNumber) {
    // Generate invoice number: INV-YYYYMM-XXXXX
    const date = this.createdAt || new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    // Find the last invoice number for this month
    const lastPayment = await this.constructor.findOne({
      invoiceNumber: new RegExp(`^INV-${year}${month}-`)
    }).sort({ invoiceNumber: -1 });
    
    let sequence = 1;
    if (lastPayment && lastPayment.invoiceNumber) {
      const lastSequence = parseInt(lastPayment.invoiceNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }
    
    this.invoiceNumber = `INV-${year}${month}-${String(sequence).padStart(5, '0')}`;
  }
});

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
