import { createTransport } from "nodemailer";
import hbs from "nodemailer-express-handlebars";
import path from "path";

// Create a transporter using Namecheap Email Hosting SMTP settings
const transporter = createTransport({
  host: "mail.privateemail.com", // Namecheap's Private Email SMTP server
  port: 465, // Use 587 for TLS
  secure: true, // false for TLS - as a boolean not string
  requireTLS: true, // Force TLS
  auth: {
    user: process.env.AUTH_EMAIL, // Your full email address
    pass: process.env.AUTH_PASS, // Email password from environment variable
  },
  tls: {
    // Do not fail on invalid certs
    rejectUnauthorized: false,
  },
});

// Configure Handlebars for email templates
const handlebarOptions = {
  viewEngine: {
    partialsDir: path.resolve("src/services/nodemailer/templates"),
    defaultLayout: "",
  },
  viewPath: path.resolve("src/services/nodemailer/templates"),
};

// Use Handlebars for template compilation
transporter.use("compile", hbs(handlebarOptions));

// Verify connection configuration
transporter.verify((error: any, success: any) => {
  if (error) {
    console.error("SMTP connection error:", error);
  } else {
    console.log("SMTP server is ready to send messages");
  }
});

export default transporter;
