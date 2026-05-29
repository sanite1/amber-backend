import express from "express";
import {
  createEnquiryController,
  createBookingEnquiryController,
} from "../controllers/contact.controller";

const router = express.Router();

// POST /api/contact/enquiry  -> general enquiry email to the inbox
router.post("/enquiry", createEnquiryController);

// POST /api/contact/booking  -> B2B on-site training booking / quote request
router.post("/booking", createBookingEnquiryController);

export default router;
