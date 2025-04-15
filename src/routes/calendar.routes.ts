import { Router } from "express";
import {
  intiateAuth,
  handleGoogleOAuthCallback,
} from "../controllers/calendar.controller";
import { handleCallbackValidation } from "../validations/calendar.validation";
import { isAuthenticated } from "../middlewares/authenticatedMiddleWare";

const router = Router();

// Step 1: Connect to Google Calendar (get auth URL)
router.get("/connect", isAuthenticated, intiateAuth);

// Step 2: Handle the Google OAuth2 callback
router.post(
  "/callback",
  isAuthenticated,
  handleCallbackValidation(),
  handleGoogleOAuthCallback,
);

export default router;
