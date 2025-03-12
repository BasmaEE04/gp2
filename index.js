// Load environment variables from .env file
require('dotenv').config();

// Import required modules
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

// Initialize Express app
const app = express();

// Middleware to enable CORS and parse JSON requests
app.use(cors());
app.use(express.json());

// Store OTPs temporarily (in production, use a database)
const otpStore = {};

// Create a Nodemailer transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER, // Use environment variable for email
    pass: process.env.EMAIL_PASS, // Use environment variable for password
  },
});

// Endpoint to send OTP
app.post('/send-otp', async (req, res) => {
  const { email } = req.body;

  // Validate email format
  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, message: 'Invalid email format.' });
  }

  // Generate a 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Store the OTP (in production, use a database)
  otpStore[email] = { otp, timestamp: Date.now() };

  // Email options
  const mailOptions = {
    from: process.env.EMAIL_USER, // Sender email
    to: email, // Recipient email
    subject: 'Your OTP Code', // Email subject
    text: `Your OTP code is ${otp}.`, // Email body
  };

  // Send the email
  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'OTP sent successfully.' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP.' });
  }
});

// Endpoint to verify OTP
app.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  // Validate email and OTP
  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
  }

  // Fetch the stored OTP
  const storedOtpData = otpStore[email];

  if (!storedOtpData) {
    return res.status(400).json({ success: false, message: 'OTP not found.' });
  }

  const { otp: storedOtp, timestamp } = storedOtpData;

  // Check if the OTP is expired (e.g., 5 minutes)
  const now = Date.now();
  const diffInMinutes = (now - timestamp) / (1000 * 60);

  if (diffInMinutes > 5) {
    return res.status(400).json({ success: false, message: 'OTP expired.' });
  }

  // Verify the OTP
  if (storedOtp === otp) {
    res.json({ success: true, message: 'OTP verified.' });
  } else {
    res.status(400).json({ success: false, message: 'Invalid OTP.' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.use(cors({
  origin: 'https://app.flutterflow.io/run/LIiWyhD7TaHhano6LVEx', 
  methods: ['GET', 'POST'],
}));
