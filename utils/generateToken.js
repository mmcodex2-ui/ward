import jwt from 'jsonwebtoken';

const generateToken = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });

  // Depending on client type, we might send token in cookie or response body.
  // We'll send it in response body for mobile app.
  return token;
};

export default generateToken;
