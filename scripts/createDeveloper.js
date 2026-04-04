/**
 * Developer Account Seeder
 * Run: node scripts/createDeveloper.js
 * 
 * This creates a super-admin "developer" account that can:
 *  - Create/revoke admin accounts
 *  - Access all admin features
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const DEVELOPER = {
  name: 'Developer',
  email: 'dev@wardapp.com',
  phoneNumber: '0000000000',
  password: 'Dev@WardApp2024!',
  role: 'developer',
  address: 'System',
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Import User model
    const userSchema = new mongoose.Schema(
      {
        name: String,
        email: { type: String, unique: true },
        phoneNumber: { type: String, unique: true },
        password: String,
        role: { type: String, enum: ['user', 'admin', 'developer'], default: 'user' },
        address: String,
        isBlocked: { type: Boolean, default: false },
        lastLogin: { type: Date, default: Date.now },
      },
      { timestamps: true }
    );

    const User = mongoose.models.User || mongoose.model('User', userSchema);

    const existing = await User.findOne({ email: DEVELOPER.email });
    if (existing) {
      console.log('✅ Developer account already exists');
      console.log(`   Email: ${DEVELOPER.email}`);
      console.log(`   Password: ${DEVELOPER.password}`);
      await mongoose.disconnect();
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(DEVELOPER.password, salt);

    await User.create({ ...DEVELOPER, password: hashed });

    console.log('\n✅ Developer account created!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Email:    ${DEVELOPER.email}`);
    console.log(`   Password: ${DEVELOPER.password}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  CHANGE PASSWORD AFTER FIRST LOGIN!\n');

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

seed();
