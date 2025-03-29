import { Request, Response, NextFunction } from "express";
import {
  createReviewService,
  getReviewsByTutorService,
  updateReviewService,
  deleteReviewService,
} from "../services/review.service";
import ApiError from "../errors/apiError";
import ApiResponse from "../errors/apiResponse";

//Student post Review
export const createReview = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const review = await createReviewService(req.body);
    return res
      .status(201)
      .json(new ApiResponse(201, "Review submitted", review));
  } catch (error) {
    next(error);
  }
};

//The reviews of each tutor
export const getReviewsByTutor = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const reviews = await getReviewsByTutorService(req.params.tutorId);
    return res
      .status(200)
      .json(new ApiResponse(200, "Reviews retrieved", reviews));
  } catch (error) {
    next(error);
  }
};

//Student update Review
export const updateReview = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const updatedReview = await updateReviewService(
      req.params.reviewId,
      req.body,
    );
    return res
      .status(200)
      .json(new ApiResponse(200, "Review updated", updatedReview));
  } catch (error) {
    next(error);
  }
};

//Student delete review
export const deleteReview = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await deleteReviewService(req.params.reviewId, req.body);
    return res.status(200).json(new ApiResponse(200, "Review deleted"));
  } catch (error) {
    next(error);
  }
};
