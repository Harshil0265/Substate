import backupUsers from './backup-users.js';
import { execSync } from 'child_process';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function safeMigrateUsers() {
  try {
    console.log('🚀 SUBSTATE User State Migration Tool');
    console.log('=====================================\n');

    console.log('This tool will:');
    console.log('1. 📦 Create a backup of your existing users');
    console.log('2. 🔄 Migrate all users to the new 8-state system');
    console.log('3. 📊 Provide detailed statistics\n');

    console.log('⚠️  IMPORTANT: This will modify ALL users in your database!');
    console.log('   Make sure you have a recent database backup.\n');

    const proceed = await askQuestion('Do you want to proceed? (yes/no): ');
    
    if (proceed.toLowerCase() !== 'yes' && proceed.toLowerCase() !== 'y') {
      console.log('❌ Migration cancelled by user');
      rl.close();
      return;
    }

    console.log('\n📦 Step 1: Creating backup...');
    const backupFile = await backupUsers();
    console.log(`✅ Backup completed: ${backupFile}`);

    console.log('\n🔄 Step 2: Starting migration...');
    const confirm = await askQuestion('Backup created successfully. Continue with migration? (yes/no): ');
    
    if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
      console.log('❌ Migration cancelled by user');
      rl.close();
      return;
    }

    // Run the migration script
    console.log('\n🚀 Running migration...');
    execSync('node scripts/migrate-existing-users-to-states.js', { stdio: 'inherit' });

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. 🌐 Start your server: npm run dev');
    console.log('2. 👨‍💼 Login as admin and visit /admin');
    console.log('3. 👥 Check the Users tab to see the new state management');
    console.log('4. 🔍 Use filters to explore different user states');
    console.log(`5. 💾 Your backup is saved at: ${backupFile}`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your MongoDB connection');
    console.log('2. Ensure your .env file is configured correctly');
    console.log('3. Make sure the database is accessible');
    console.log('4. If needed, restore from backup and try again');
  } finally {
    rl.close();
  }
}

// Run the safe migration
safeMigrateUsers();