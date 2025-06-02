// const jwt = require("jsonwebtoken");
import jwt from "jsonwebtoken";
import db from '../db.js'; // Adjust the path as necessary

const isAdmin = async (req, res, next) => {
    try {
        const token = req.session.adminToken;

        if (!token) {
            return res.redirect("/admin/login");
        }

        const decoded = jwt.verify(token, 'process.env.JWT_SECRET');
        const [admin] = await db.query("SELECT * FROM admins WHERE id = ?", [decoded.adminId]);

        if (!admin) {
            return res.redirect("/admin/login");
        }
        req.admin = admin;
        req.adminId = decoded.adminId;
        next();
    } catch (error) {
        console.error("Authentication Error:", error);
        return res.redirect("/admin/login");
    }
};

export default isAdmin;
