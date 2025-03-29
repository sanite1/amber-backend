import { Router } from "express";
import {
  createReview,
  getReviewsByTutor,
  updateReview,
  deleteReview,
} from "../controllers/reviews.controller";
import {
  createReviewValidation,
  updateReviewValidation,
  deleteReviewValidation,
  getReviewsByTutorValidation,
} from "../validations/review.validation";
import { isAuthenticated } from "../middlewares/authenticatedMiddleWare";
const router = Router();

//Student submit review
router.post("/", isAuthenticated, createReviewValidation(), createReview);

//Get review for a specific tutor
router.get(
  "/tutor/:tutorId",
  isAuthenticated,
  getReviewsByTutorValidation(),
  getReviewsByTutor,
);

//Update existing reviews
router.patch(
  "/:reviewId",
  isAuthenticated,
  updateReviewValidation(),
  updateReview,
);

//delete a review
router.delete(
  "/:reviewId",
  isAuthenticated,
  deleteReviewValidation(),
  deleteReview,
);

export default router;
