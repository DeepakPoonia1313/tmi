import express from 'express';
import bcrypt from 'bcrypt';
import db from '../../db.js'; // Adjust the path as necessary
import isAdmin from '../../middleware/adminMiddleware.js';
import jwt from "jsonwebtoken";
import nodemailer from 'nodemailer';


const router = express.Router();

const transporter = nodemailer.createTransport({
  service: 'gmail', // Or 'outlook', 'smtp.mailtrap.io' etc.
  auth: {
    user: process.env.ADMIN_EMAIL_USER,
    pass: process.env.ADMIN_EMAIL_PASS,
  },
});

// --- Helper function to generate OTP ---
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
}

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const [admin] = await db.query("SELECT * FROM admins WHERE email = ?", [email]);
    // console.log(admin, admin.length)

    if (!admin) {
      return res.render('admin/login', { error: 'Invalid email or password' });
    }


    const valid = password == admin[0].password;
    if (!valid) {
      return res.render('admin/login', { error: 'Invalid email or password' });
    }

    const token = jwt.sign({ adminId: admin[0].id }, 'process.env.JWT_SECRET', {
      expiresIn: "7d",
    });

    // ✅ Store Token in Session
    req.session.adminToken = token;
    req.session.adminId = admin.id;

    return res.redirect("/admin/dashboard");
  } catch (err) {
    console.error("Admin Login Error:", err);
    return res.render("admin/login", {
      error: "Server error. Please try again.",
      errorMessage: err.message,
      success: null,
    });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

router.get('/forgot-password', (req, res) => {
  res.render('admin/forgot-password', { error: null, success: null });
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Check if admin with this email exists
    const [admins] = await db.query("SELECT * FROM admins WHERE email = ?", [email]);

    if (admins.length === 0) {
      return res.render('admin/forgot-password', {
        error: 'No account found with that email address.',
        success: null
      });
    }

    const admin = admins[0];

    // 2. Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

    // 3. Store OTP in DB (or cache)
    await db.query("INSERT INTO otp_codes (email, otp_code, expires_at) VALUES (?, ?, ?)", [email, otp, expiresAt]);

    // 4. Send OTP to email
    const mailOptions = {
      from: process.env.ADMIN_EMAIL_USER,
      to: email,
      subject: 'Password Reset OTP for Admin Panel',
      html: `
                <p>Hello ${admin.email},</p>
                <p>Your One-Time Password (OTP) for resetting your admin panel password is:</p>
                <h3><b>${otp}</b></h3>
                <p>This OTP is valid for 10 minutes.</p>
                <p>If you did not request this, please ignore this email.</p>
            `,
    };

    // await transporter.sendMail(mailOptions);
    console.log(mailOptions);

    // Redirect to OTP verification page, passing email to pre-fill or identify
    req.session.resetEmail = email; // Store email in session for OTP verification
    res.redirect('/admin/verify-otp');

  } catch (err) {
    console.error("Forgot Password Error:", err);
    return res.render("admin/forgot-password", {
      error: "Server error. Please try again.",
      errorMessage: err.message,
      success: null,
    });
  }
});

router.get('/verify-otp', (req, res) => {
  if (!req.session.resetEmail) {
    // If they landed here without going through forgot password, redirect
    return res.redirect('/admin/forgot-password');
  }
  res.render('admin/verify-otp', { email: req.session.resetEmail, error: null, success: null });
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { otp } = req.body;
    const email = req.session.resetEmail; // Get email from session

    if (!email) {
      return res.render('admin/verify-otp', { error: 'Session expired or email not found.', email: null });
    }

    // 1. Fetch the latest OTP for this email
    const [otpEntries] = await db.query(
      "SELECT * FROM otp_codes WHERE email = ? ORDER BY created_at DESC LIMIT 1",
      [email]
    );

    if (otpEntries.length === 0) {
      return res.render('admin/verify-otp', { error: 'Invalid or expired OTP.', email: email });
    }

    const storedOtp = otpEntries[0];

    // 2. Check if OTP matches and is not expired
    const now = new Date();
    if (storedOtp.otp_code !== otp || now > storedOtp.expires_at) {
      return res.render('admin/verify-otp', { error: 'Invalid or expired OTP.', email: email });
    }

    // 3. OTP is valid, store a flag in session to allow password change
    req.session.canChangePassword = true;
    res.redirect('/admin/change-password');

  } catch (err) {
    console.error("Verify OTP Error:", err);
    return res.render("admin/verify-otp", {
      error: "Server error. Please try again.",
      errorMessage: err.message,
      email: req.session.resetEmail,
      success: null,
    });
  }
});

router.get('/change-password', (req, res) => {
  // Ensure user has gone through OTP verification
  if (!req.session.resetEmail || !req.session.canChangePassword) {
    return res.redirect('/admin/forgot-password');
  }
  res.render('admin/change-password', { error: null, success: null });
});


router.post('/change-password', async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;
    const email = req.session.resetEmail; // Get email from session

    if (!email || !req.session.canChangePassword) {
      return res.render('admin/change-password', { error: 'Unauthorized access or session expired.', success: null });
    }

    if (newPassword !== confirmPassword) {
      return res.render('admin/change-password', { error: 'Passwords do not match.', success: null });
    }

    // --- IMPORTANT: Hash the new password before storing in production ---
    // const hashedPassword = await bcrypt.hash(newPassword, 10); // 10 is the salt rounds

    // Update the admin's password
    await db.query("UPDATE admins SET password = ? WHERE email = ?", [newPassword, email]);
    // await db.query("UPDATE admins SET password = ? WHERE email = ?", [hashedPassword, email]); // Use this in production

    // Clear session flags related to password reset
    delete req.session.resetEmail;
    delete req.session.canChangePassword;

    return res.render('admin/login', { success: 'Password has been successfully changed. Please log in.', error: null });

  } catch (err) {
    console.error("Change Password Error:", err);
    return res.render("admin/change-password", {
      error: "Server error. Please try again.",
      errorMessage: err.message,
      success: null,
    });
  }
})

router.get('/dashboard', isAdmin, async (req, res) => {
  try {
    const [tables] = await db.query("SHOW TABLES");
    const tableNames = tables.map(row => Object.values(row)[0]);

    // Get full descriptions for each table
    const tableDetails = {};

    for (const table of tableNames) {
      const [columns] = await db.query(`DESCRIBE \`${table}\``);
      tableDetails[table] = columns;
    }

    res.render('admin/dashboard', {
      tableNames,
      tableDetails,
      adminUsername: req.session.adminId
    });
  } catch (err) {
    console.error('Error fetching table data:', err);
    res.render('admin/dashboard', {
      tableNames: [],
      tableDetails: {},
      error: 'Could not load table details',
      errorMessage: err.message,
    });
  }
});

export default router;