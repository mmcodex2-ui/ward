/**
 * Admin Account Seeder
 * Run: node scripts/createAdmin.js
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const ADMIN = {
  name: 'Ward Admin',
  email: 'admin@wardapp.com',
  phoneNumber: '9999999999',
  password: 'Admin@Ward2024!',
  role: 'admin',
  address: 'Ward Office',
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

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

    const existing = await User.findOne({ email: ADMIN.email });
    if (existing) {
      console.log('✅ Admin account already exists');
      console.log(`   Email: ${ADMIN.email}`);
      console.log(`   Password: ${ADMIN.password}`);
      await mongoose.disconnect();
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(ADMIN.password, salt);

    await User.create({ ...ADMIN, password: hashed });

    console.log('\n✅ Admin account created!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Email:    ${ADMIN.email}`);
    console.log(`   Password: ${ADMIN.password}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

seed();
