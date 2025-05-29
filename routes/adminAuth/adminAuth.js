import express from 'express';
import bcrypt from 'bcrypt';
import db from '../../db.js'; // Adjust the path as necessary
import isAdmin from '../../middleware/adminMiddleware.js';
import jwt from "jsonwebtoken";


const router = express.Router();

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const [admin] = await db.query("SELECT * FROM admins WHERE username = ?", [username]);
        console.log(admin, admin.length)

        if (!admin) {
            return res.render('admin/login', { error: 'Invalid username or password' });
        }


        const valid = password == admin[0].password;
        if (!valid) {
            return res.render('admin/login', { error: 'Invalid username or password' });
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
            success: null,
        });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/admin/login');
    });
});

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
    });
  }
});


export default router;