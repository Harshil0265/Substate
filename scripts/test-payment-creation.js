import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testPaymentCreation() {
  try {
    console.log('🧪 Testing payment creation...');
    
    // First, we need to login to get a token
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@substate.com', // Assuming this admin user exists
      password: 'admin123'
    });
    
    const token = loginResponse.data.accessToken;
    console.log('✅ Login successful');
    
    // Test payment creation
    console.log('💳 Creating payment order...');
    const paymentResponse = await axios.post('http://localhost:5000/api/payments/create-order', {
      planId: 'PROFESSIONAL'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Payment order created successfully!');
    console.log('Order details:', {
      orderId: paymentResponse.data.orderId,
      amount: paymentResponse.data.amount,
      paymentId: paymentResponse.data.paymentId,
      plan: paymentResponse.data.subscription.plan
    });
    
  } catch (error) {
    console.error('❌ Test failed:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
  }
}

testPaymentCreation();