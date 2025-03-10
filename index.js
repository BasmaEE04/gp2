const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
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
    user: 'ishrak.riyadh@gmail.com', // Replace with your Gmail address
    pass: 'vqntwaaokczpcqry', // Replace with your Gmail password or app password
  },
});

// Endpoint to send OTP
app.post('/send-otp', async (req, res) => {
  const { email } = req.body;

  // Generate a 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Store the OTP (in production, use a database)
  otpStore[email] = { otp, timestamp: Date.now() };

  // Email options
  const mailOptions = {
    from: 'ishrak.riyadh@gmail.com', // Replace with your Gmail address
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is ${otp}.`,
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
