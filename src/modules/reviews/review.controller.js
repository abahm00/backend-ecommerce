import { Review } from "../../../database/models/review.model.js";
import { handleError } from "../../middlewares/catchError.js";

import { Product } from "../../../database/models/product.model.js";

export const addReview = handleError(async (req, res, next) => {
  const {
    product: productId,
    rate: rating,
    comment = "No comment provided",
  } = req.body;

  if (typeof rating !== "number" || rating < 0 || rating > 5) {
    return res.status(400).json({ message: "Invalid review data." });
  }

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: "Product not found." });
  }

  const userReview = product.reviews.find(
    (review) => review.user.toString() === req.user._id.toString()
  );
  if (userReview) {
    return res
      .status(400)
      .json({ message: "You have already reviewed this product." });
  }

  product.reviews.push({ user: req.user._id, rating, comment });

  const ratings = product.reviews.map((review) => review.rating);
  const totalReviews = ratings.length;
  const averageRating =
    ratings.reduce((acc, rating) => acc + rating, 0) / totalReviews;

  product.rateAvg = averageRating;
  product.rateCount = totalReviews;

  await product.save();

  res.status(201).json({ message: "Review added successfully!", product });
});

export const getAllReviews = handleError(async (req, res, next) => {
  const { id } = req.params;

  const product = await Product.findById(id);
  if (!product) {
    return res.status(404).json({ message: "Product not found." });
  }

  res.json({
    reviews: product.reviews,
    rateAvg: product.rateAvg,
    rateCount: product.rateCount,
  });
});

export const updateReview = handleError(async (req, res, next) => {
  const { rate: newRating, comment } = req.body;

  if (typeof newRating !== "number" || newRating < 0 || newRating > 5) {
    return res.status(400).json({ message: "Invalid review data." });
  }

  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found." });
  }

  const review = product.reviews.find(
    (r) => r.user.toString() === req.user._id.toString()
  );
  if (!review) {
    return res.status(400).json({ message: "Review not found." });
  }

  review.rating = newRating;
  review.comment = comment || review.comment;

  const ratings = product.reviews.map((review) => review.rating);
  const totalReviews = ratings.length;
  const averageRating =
    ratings.reduce((acc, rating) => acc + rating, 0) / totalReviews;

  product.rateAvg = averageRating;
  product.rateCount = totalReviews;

  await product.save();

  res.json({ message: "Review updated successfully!", product });
});

export const deleteReview = handleError(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found." });
  }

  const reviewIndex = product.reviews.findIndex(
    (r) => r.user.toString() === req.user._id.toString()
  );
  if (reviewIndex === -1) {
    return res.status(400).json({ message: "Review not found." });
  }

  product.reviews.splice(reviewIndex, 1);

  const ratings = product.reviews.map((review) => review.rating);
  const totalReviews = ratings.length;
  const averageRating =
    ratings.reduce((acc, rating) => acc + rating, 0) / totalReviews;

  product.rateAvg = averageRating;
  product.rateCount = totalReviews;

  await product.save();

  res.json({ message: "Review deleted successfully.", product });
});
