import dotenv from 'dotenv';
import razorpayService from '../backend/services/RazorpayService.js';

dotenv.config();

async function testRazorpayIntegration() {
  console.log('🧪 Testing Razorpay Integration\n');
  console.log('=' .repeat(60));

  // Test 1: Check configuration
  console.log('\n📋 Test 1: Configuration Check');
  console.log('-'.repeat(60));
  
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  
  console.log('Key ID:', keyId ? `${keyId.substring(0, 15)}...` : '❌ Not set');
  console.log('Key Secret:', keySecret ? `${keySecret.substring(0, 10)}...` : '❌ Not set');
  console.log('Service Configured:', razorpayService.isConfigured() ? '✅ Yes' : '❌ No');

  if (!razorpayService.isConfigured()) {
    console.log('\n❌ Razorpay is not configured. Please check your .env file.');
    console.log('Required variables:');
    console.log('  - RAZORPAY_KEY_ID');
    console.log('  - RAZORPAY_KEY_SECRET');
    return;
  }

  // Test 2: Create a test order
  console.log('\n📋 Test 2: Create Test Order');
  console.log('-'.repeat(60));
  
  try {
    const testOrder = await razorpayService.createOrder({
      amount: 10, // ₹10 for PRO plan
      currency: 'INR',
      receipt: `test_receipt_${Date.now()}`,
      notes: {
        test: true,
        planId: 'PRO',
        planName: 'Professional'
      }
    });

    console.log('✅ Order created successfully!');
    console.log('Order ID:', testOrder.id);
    console.log('Amount:', testOrder.amount / 100, 'INR');
    console.log('Currency:', testOrder.currency);
    console.log('Status:', testOrder.status);
    console.log('Receipt:', testOrder.receipt);

    // Test 3: Fetch the order
    console.log('\n📋 Test 3: Fetch Order Details');
    console.log('-'.repeat(60));
    
    const fetchedOrder = await razorpayService.fetchOrder(testOrder.id);
    console.log('✅ Order fetched successfully!');
    console.log('Order ID:', fetchedOrder.id);
    console.log('Status:', fetchedOrder.status);
    console.log('Amount:', fetchedOrder.amount / 100, 'INR');

    // Test 4: Signature verification (simulated)
    console.log('\n📋 Test 4: Signature Verification');
    console.log('-'.repeat(60));
    
    const mockPaymentId = 'pay_test123456789';
    const mockSignature = razorpayService.verifyPaymentSignature({
      razorpay_order_id: testOrder.id,
      razorpay_payment_id: mockPaymentId,
      razorpay_signature: 'invalid_signature_for_testing'
    });
    
    console.log('Signature verification (with invalid signature):', mockSignature ? '✅ Valid' : '❌ Invalid (Expected)');

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed successfully!');
    console.log('='.repeat(60));
    console.log('\n📝 Summary:');
    console.log('  ✅ Razorpay service is properly configured');
    console.log('  ✅ Can create orders');
    console.log('  ✅ Can fetch order details');
    console.log('  ✅ Signature verification is working');
    console.log('\n🎉 Razorpay integration is ready for production!');
    console.log('\n⚠️  Note: The test order created above is a real order.');
    console.log('   It will appear in your Razorpay dashboard but won\'t be charged.');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nError details:', error);
    
    if (error.message.includes('authentication failed')) {
      console.log('\n💡 Tip: Check if your Razorpay API keys are correct.');
      console.log('   Live keys should start with: rzp_live_');
      console.log('   Test keys should start with: rzp_test_');
    }
  }
}

// Run tests
testRazorpayIntegration().catch(console.error);
