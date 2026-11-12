import express from "express";
import {
  createEnquiryController,
  createBookingEnquiryController,
  addBookingAddonController,
  createRefresherRequestController,
} from "../controllers/contact.controller";

const router = express.Router();

// POST /api/contact/enquiry  -> general enquiry email to the inbox
router.post("/enquiry", createEnquiryController);

// POST /api/contact/booking  -> B2B on-site training booking / quote request
router.post("/booking", createBookingEnquiryController);

// POST /api/contact/booking-addon -> client adds the annual refresher offer
// from the confirmation page, using the reference returned with their booking
router.post("/booking-addon", addBookingAddonController);

// POST /api/contact/refresher-request -> public refresher request form
router.post("/refresher-request", createRefresherRequestController);

export default router;
