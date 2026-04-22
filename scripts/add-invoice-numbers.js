import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Payment from '../backend/models/Payment.js';

dotenv.config();

async function addInvoiceNumbers() {
  try {
    console.log('🔧 Adding invoice numbers to payments without them\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all payments without invoice numbers
    const paymentsWithoutInvoice = await Payment.find({ 
      invoiceNumber: { $exists: false }
    }).sort({ createdAt: 1 });

    console.log(`Found ${paymentsWithoutInvoice.length} payments without invoice numbers\n`);

    for (const payment of paymentsWithoutInvoice) {
      const date = payment.createdAt || new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      
      // Find the last invoice number for this month
      const lastPayment = await Payment.findOne({
        invoiceNumber: new RegExp(`^INV-${year}${month}-`)
      }).sort({ invoiceNumber: -1 });
      
      let sequence = 1;
      if (lastPayment && lastPayment.invoiceNumber) {
        const lastSequence = parseInt(lastPayment.invoiceNumber.split('-')[2]);
        sequence = lastSequence + 1;
      }
      
      const invoiceNumber = `INV-${year}${month}-${String(sequence).padStart(5, '0')}`;
      
      // Update directly without triggering pre-save hook
      await Payment.updateOne(
        { _id: payment._id },
        { $set: { invoiceNumber: invoiceNumber } }
      );
      
      console.log(`✅ Added invoice ${invoiceNumber} to payment ${payment._id}`);
      console.log(`   Plan: ${payment.planType}, Amount: ₹${payment.amount}, Date: ${payment.createdAt.toLocaleDateString('en-IN')}\n`);
    }

    console.log('✅ All invoice numbers added successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

addInvoiceNumbers();
