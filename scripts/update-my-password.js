import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import readline from 'readline';
import User from '../backend/models/User.js';

dotenv.config();

// Create readline interface for secure password input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to hide password input
function askPassword(query) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    
    stdout.write(query);
    stdin.resume();
    stdin.setRawMode(true);
    stdin.setEncoding('utf8');
    
    let password = '';
    
    stdin.on('data', function onData(char) {
      char = char.toString('utf8');
      
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004': // Ctrl+D
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener('data', onData);
          stdout.write('\n');
          resolve(password);
          break;
        case '\u0003': // Ctrl+C
          process.exit();
          break;
        case '\u007f': // Backspace
        case '\b':
          if (password.length > 0) {
            password = password.slice(0, -1);
            stdout.clearLine();
            stdout.cursorTo(0);
            stdout.write(query + '*'.repeat(password.length));
          }
          break;
        default:
          password += char;
          stdout.write('*');
          break;
      }
    });
  });
}

async function updatePassword() {
  try {
    console.log('🔐 UPDATE YOUR PASSWORD\n');
    console.log('=' .repeat(60));
    
    // Get email from command line or prompt
    let email = process.argv[2];
    
    if (!email) {
      email = await new Promise((resolve) => {
        rl.question('\n📧 Enter your email: ', (answer) => {
          resolve(answer.trim());
        });
      });
    }

    if (!email) {
      console.log('❌ Email is required');
      process.exit(1);
    }

    console.log('\n🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      rl.close();
      process.exit(1);
    }

    console.log('📋 User found:');
    console.log('   Name:', user.name);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log();

    // Get new password
    const newPassword = await askPassword('🔑 Enter your NEW password: ');
    
    if (!newPassword || newPassword.length < 6) {
      console.log('\n❌ Password must be at least 6 characters long');
      rl.close();
      process.exit(1);
    }

    const confirmPassword = await askPassword('🔑 Confirm your NEW password: ');
    
    if (newPassword !== confirmPassword) {
      console.log('\n❌ Passwords do not match!');
      rl.close();
      process.exit(1);
    }

    // Hash and save the new password
    console.log('\n🔄 Updating password...');
    user.password = newPassword; // Don't hash manually - the model will do it automatically
    
    // Reset any account locks
    user.accountLocked = false;
    user.lockedUntil = null;
    user.failedLoginAttempts = 0;
    
    await user.save();

    console.log('\n✅ PASSWORD UPDATED SUCCESSFULLY!');
    console.log('=' .repeat(60));
    console.log('\n📝 Your credentials:');
    console.log('   Email:', email);
    console.log('   Password: [Your new password]');
    console.log('\n   You can now login with your new password.');
    console.log('   Please keep your password secure and do not share it.\n');

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

updatePassword();
