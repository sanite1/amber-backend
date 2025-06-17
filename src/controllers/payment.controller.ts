import { Request, Response, NextFunction } from "express";
import { createReviewService } from "../services/review.service";
import ApiError from "../errors/apiError";
import ApiResponse from "../errors/apiResponse";
const express = require("express");
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

//Student post Review
export const createPayment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // const review = await createReviewService(req.body);
  const { items } = req.body;

  const domain = process.env.DOMAIN_NAME;
  console.log(`${domain}/booking-confirmed`);
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: items.map((item: any) => ({
        price_data: {
          currency: "usd",
          product_data: { name: item.name },
          unit_amount: item.price * 100, // $10.00 → 1000
        },
        quantity: item.quantity,
      })),
      success_url: `${domain}/booking-confirmed`,
      cancel_url: "http://localhost:3000/cancel",
    });

    console.log(`${domain}/booking-confirmed`);

    return res
      .status(201)
      .json(new ApiResponse(201, "Payment created", { id: session.id }));
  } catch (err) {
    console.error("Stripe session error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
};
