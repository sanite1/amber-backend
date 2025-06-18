import { Request, Response, NextFunction } from "express";
import { createReviewService } from "../services/review.service";
import ApiError from "../errors/apiError";
import ApiResponse from "../errors/apiResponse";
import { sendOurVeBookingNotification } from "../services/nodemailer/mail.service";
const express = require("express");
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

//Student post Review
export const createPayment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { items } = req.body;

  const domain = process.env.DOMAIN_NAME;
  console.log(`${domain}/booking-confirmed`);
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: items.map((item: any) => ({
        price_data: {
          currency: "gbp",
          product_data: {
            name: item.name,
            images: [
              "https://res.cloudinary.com/dv4uk8qqc/image/upload/v1750163575/Amber_Users/s3xdjwnn5e3pjeggiffv.jpg",
            ],
          },
          unit_amount: item.price * 100, // $10.00 → 1000
        },
        quantity: item.quantity,
      })),
      success_url: `${domain}/booking-confirmed`,
      cancel_url: `${domain}/course-dates`,
    });

    console.log("before sending the email");
    console.log(items[0]);

    await sendOurVeBookingNotification(items[0]);
    console.log("after sending the email");

    return res
      .status(201)
      .json(new ApiResponse(201, "Payment created", { id: session.id }));
  } catch (err) {
    console.error("Stripe session error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
};
