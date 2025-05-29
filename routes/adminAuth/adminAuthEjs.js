import express from 'express';
import db from '../../db.js'
import isAdmin from '../../middleware/adminMiddleware.js';
import jwt from "jsonwebtoken";

const router = express.Router();
// Show login page
router.get('/login', (req, res) => {
    res.render('admin/login', { error: null });
});

export default router;