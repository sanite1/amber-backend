import Review from "../models/review";
import ApiError from "../errors/apiError";
import ApiResponse from "../errors/apiResponse";
import User from "../models/User";

export const createReviewService = async (data: any) => {
  const { tutorId, studentId, rating, comment } = data;

  const tutorUser = await User.findById(tutorId);
  if (!tutorUser) {
    throw new ApiError(404, "Tutor not found");
  }
  if (tutorUser.role !== "tutor") {
    throw new ApiError(400, "Invalid tutor ID: User is not a tutor");
  }

  const existingReview = await Review.findOne({ tutorId, studentId });
  if (existingReview) {
    throw new ApiError(
      400,
      "You have already submitted a review for this tutor. Please update your existing review.",
    );
  }

  const review = await Review.create({ tutorId, studentId, rating, comment });

  // Update tutor's reviews count and push rating
  await User.findByIdAndUpdate(tutorId, {
    $inc: { numberOfReviews: 1 },
    $push: { ratings: rating },
  });

  return review;
};

export const getReviewsByTutorService = async (tutorId: string) => {
  const tutor = await User.findById(tutorId);
  if (!tutor) {
    throw new ApiError(404, "Tutor not found");
  }
  if (tutor.role !== "tutor") {
    throw new ApiError(400, "Invalid tutor ID:User is not a tutor");
  }

  return await Review.find({ tutorId: tutorId }).populate({
    path: "studentId",
    select: "firstname lastname",
  });
};

export const updateReviewService = async (reviewId: string, data: any) => {
  const review = await Review.findById(reviewId);
  if (!review) {
    throw new ApiError(404, "Review not found");
  }
  if (review.studentId.toString() !== data.studentId) {
    throw new ApiError(403, "Not authorized to update this review");
  }

  //Perform update
  const updatedReview = await Review.findByIdAndUpdate(reviewId, data, {
    new: true,
  });
  return updatedReview;
};

export const deleteReviewService = async (reviewId: string, data: any) => {
  const review = await Review.findById(reviewId);
  if (!review) {
    throw new ApiError(404, "Review not found");
  }
  if (review.studentId.toString() !== data.studentId) {
    throw new ApiError(403, "Not authorized to delete this review");
  }

  await Review.findByIdAndDelete(reviewId);
};
