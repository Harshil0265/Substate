import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Article from '../backend/models/Article.js';

dotenv.config();

async function migrateIsDeletedField() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/substate');
    console.log('✅ Connected to MongoDB');

    // Find all articles without isDeleted field
    const articlesWithoutField = await Article.find({
      isDeleted: { $exists: false }
    });

    console.log(`\n📊 Found ${articlesWithoutField.length} articles without isDeleted field`);

    if (articlesWithoutField.length === 0) {
      console.log('✅ All articles already have isDeleted field');
      await mongoose.connection.close();
      return;
    }

    console.log('🔄 Updating articles...');

    // Update all articles to have isDeleted: false
    const result = await Article.updateMany(
      { isDeleted: { $exists: false } },
      { 
        $set: { 
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
          deleteReason: null
        } 
      }
    );

    console.log(`\n✅ Migration completed!`);
    console.log(`   Modified: ${result.modifiedCount} articles`);
    console.log(`   Matched: ${result.matchedCount} articles`);

    // Verify the migration
    const remainingWithoutField = await Article.countDocuments({
      isDeleted: { $exists: false }
    });

    console.log(`\n✅ Verification:`);
    console.log(`   Articles without isDeleted field: ${remainingWithoutField}`);

    const totalArticles = await Article.countDocuments({});
    const activeArticles = await Article.countDocuments({ isDeleted: false });
    const deletedArticles = await Article.countDocuments({ isDeleted: true });

    console.log(`   Total articles: ${totalArticles}`);
    console.log(`   Active articles: ${activeArticles}`);
    console.log(`   Deleted articles: ${deletedArticles}`);

    await mongoose.connection.close();
    console.log('\n✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

migrateIsDeletedField();
