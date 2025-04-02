import { Router } from "express";
import {
  getMessages,
  sendStudentMessage,
  sendTutorMessage,
} from "../controllers/message.controller";
import {
  sendMessageValidation,
  getMessageValidation,
} from "../validations/message.validation";
import { isAuthenticated } from "../middlewares/authenticatedMiddleWare";

const router = Router();

//Student send a message
router.post(
  "/sendMessagetoTutor",
  isAuthenticated,
  sendMessageValidation(),
  sendStudentMessage,
);

//Tutor sends a message
router.post(
  "/sendMessagetoStudent",
  isAuthenticated,
  sendMessageValidation(),
  sendTutorMessage,
);

//Retrieve chat history between two users
router.get("/chat", isAuthenticated, getMessageValidation(), getMessages);

export default router;
