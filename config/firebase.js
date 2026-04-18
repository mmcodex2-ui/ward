import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In production, use environment variables or point to the JSON file
// For local testing, place your serviceAccountKey.json in backend/config/
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
  });
  console.log('Firebase Admin initialized');
} catch (error) {
  console.warn('Firebase Admin NOT initialized. Please check serviceAccountKey.json');
}

export default admin;
