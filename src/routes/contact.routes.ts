import express from "express";
import { createEnquiryController } from "../controllers/contact.controller";

const router = express.Router();

// POST /api/contact/enquiry  -> emails the Amber Training inbox
router.post("/enquiry", createEnquiryController);

export default router;
