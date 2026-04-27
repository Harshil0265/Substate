import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function fixPaymentIndex() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('payments');

    console.log('📋 Checking existing indexes...');
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(idx => ({ name: idx.name, key: idx.key })));

    // Check if the problematic transactionId index exists
    const transactionIdIndex = indexes.find(idx => idx.key && idx.key.transactionId);
    
    if (transactionIdIndex) {
      console.log('🗑️ Dropping existing transactionId index...');
      await collection.dropIndex('transactionId_1');
      console.log('✅ Dropped transactionId index');
    }

    // Update all existing payments with null transactionId to undefined
    console.log('🔄 Updating payments with null transactionId...');
    const updateResult = await collection.updateMany(
      { transactionId: null },
      { $unset: { transactionId: "" } }
    );
    console.log(`✅ Updated ${updateResult.modifiedCount} payments`);

    // Create the new sparse unique index
    console.log('📝 Creating new sparse unique index for transactionId...');
    await collection.createIndex(
      { transactionId: 1 }, 
      { 
        unique: true, 
        sparse: true,
        name: 'transactionId_1_sparse'
      }
    );
    console.log('✅ Created new sparse unique index');

    // Verify the fix
    console.log('🔍 Verifying the fix...');
    const finalIndexes = await collection.indexes();
    const newTransactionIdIndex = finalIndexes.find(idx => idx.key && idx.key.transactionId);
    
    if (newTransactionIdIndex) {
      console.log('✅ New index created successfully:', {
        name: newTransactionIdIndex.name,
        unique: newTransactionIdIndex.unique,
        sparse: newTransactionIdIndex.sparse
      });
    }

    // Count payments with no transactionId
    const paymentsWithoutTransactionId = await collection.countDocuments({
      transactionId: { $exists: false }
    });
    console.log(`📊 Payments without transactionId: ${paymentsWithoutTransactionId}`);

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
fixPaymentIndex();