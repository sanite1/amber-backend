import { Router } from "express";
import { isAuthenticated } from "../middlewares/authenticatedMiddleWare";
import {
  validateGetTutorAvailability,
  validateCreateTutorAvailability,
  validateUpdateTutorAvailability,
} from "../validations/availability.validation";
import {
  createAvailability,
  getAvailability,
  updateAvailability,
} from "../controllers/availability.controller";

const router = Router();

router
  .route("/create")
  .post(isAuthenticated, validateCreateTutorAvailability(), createAvailability);

router
  .route("/:id")
  .get(isAuthenticated, validateGetTutorAvailability(), getAvailability)
  .patch(
    isAuthenticated,
    validateUpdateTutorAvailability(),
    updateAvailability,
  );

export default router;
