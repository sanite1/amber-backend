import { Router } from "express";
import { createPayment } from "../controllers/payment.controller";

// Express route to create Checkout session

const router = Router();

router.post("/create-checkout-session", createPayment);

export default router;
