import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function fixPaymentIndexComplete() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('payments');

    console.log('📋 Checking existing indexes...');
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(idx => ({ name: idx.name, key: idx.key, unique: idx.unique, sparse: idx.sparse })));

    // Drop ALL transactionId related indexes
    const transactionIdIndexes = indexes.filter(idx => 
      idx.key && idx.key.transactionId !== undefined
    );
    
    for (const index of transactionIdIndexes) {
      console.log(`🗑️ Dropping index: ${index.name}`);
      try {
        await collection.dropIndex(index.name);
        console.log(`✅ Dropped index: ${index.name}`);
      } catch (error) {
        console.log(`⚠️ Could not drop index ${index.name}:`, error.message);
      }
    }

    // Remove transactionId field from all documents that have null values
    console.log('🔄 Removing null transactionId fields...');
    const updateResult = await collection.updateMany(
      { 
        $or: [
          { transactionId: null },
          { transactionId: { $exists: true, $eq: null } }
        ]
      },
      { $unset: { transactionId: "" } }
    );
    console.log(`✅ Updated ${updateResult.modifiedCount} payments`);

    // Wait a moment for the changes to propagate
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create the new proper sparse unique index
    console.log('📝 Creating new sparse unique index for transactionId...');
    await collection.createIndex(
      { transactionId: 1 }, 
      { 
        unique: true, 
        sparse: true,
        name: 'transactionId_1_sparse_unique',
        background: true
      }
    );
    console.log('✅ Created new sparse unique index');

    // Verify the fix
    console.log('🔍 Verifying the fix...');
    const finalIndexes = await collection.indexes();
    console.log('Final indexes:', finalIndexes.map(idx => ({ 
      name: idx.name, 
      key: idx.key, 
      unique: idx.unique, 
      sparse: idx.sparse 
    })));

    // Count documents
    const totalPayments = await collection.countDocuments();
    const paymentsWithTransactionId = await collection.countDocuments({
      transactionId: { $exists: true, $ne: null }
    });
    const paymentsWithoutTransactionId = await collection.countDocuments({
      $or: [
        { transactionId: { $exists: false } },
        { transactionId: null }
      ]
    });

    console.log(`📊 Payment statistics:`);
    console.log(`   Total payments: ${totalPayments}`);
    console.log(`   With transactionId: ${paymentsWithTransactionId}`);
    console.log(`   Without transactionId: ${paymentsWithoutTransactionId}`);

    // Test creating a document with no transactionId to ensure it works
    console.log('🧪 Testing document creation...');
    const testDoc = {
      userId: new mongoose.Types.ObjectId(),
      amount: 100,
      currency: 'INR',
      status: 'PENDING',
      paymentMethod: 'RAZORPAY',
      planType: 'PROFESSIONAL',
      billingPeriod: 'MONTHLY',
      description: 'Test payment',
      createdAt: new Date()
    };

    const insertResult = await collection.insertOne(testDoc);
    console.log('✅ Test document created successfully:', insertResult.insertedId);

    // Clean up test document
    await collection.deleteOne({ _id: insertResult.insertedId });
    console.log('✅ Test document cleaned up');

    console.log('🎉 Payment index fix completed successfully!');

  } catch (error) {
    console.error('❌ Error fixing payment index:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the fix
fixPaymentIndexComplete();