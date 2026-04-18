import admin from '../config/firebase.js';

/**
 * Send a push notification to one or more devices
 * @param {string|string[]} tokens - One or more device tokens
 * @param {string} title - Title of the notification
 * @param {string} body - Body of the notification
 * @param {object} data - Optional extra data
 */
export const sendPushNotification = async (tokens, title, body, data = {}) => {
  if (!tokens || (Array.isArray(tokens) && tokens.length === 0)) return;
  
  if (!admin || !admin.apps.length) {
    console.warn('Firebase Admin not initialized. Skipping notification.');
    return;
  }

  const message = {
    notification: {
      title,
      body,
    },
    data: {
      ...data,
      click_action: 'FLUTTER_NOTIFICATION_CLICK', // Standard for many libraries
    },
  };

  try {
    if (Array.isArray(tokens)) {
      // Send to multiple tokens
      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        ...message
      });
      console.log(`Successfully sent ${response.successCount} messages`);
    } else {
      // Send to single token
      const response = await admin.messaging().send({
        token: tokens,
        ...message
      });
      console.log('Successfully sent message:', response);
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};
