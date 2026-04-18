import express from "express";
import {
  authUser,
  registerUser,
  googleAuth,
  updatePushToken,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Register user
router.post("/register", registerUser);

// Login user
router.post("/login", authUser);

// Google auth
router.post("/google", googleAuth);

// Update push notification token
router.put("/profile/push-token", protect, updatePushToken);

export default router;