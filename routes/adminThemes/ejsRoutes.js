import express from 'express';
import db from '../../db.js'; // Adjust the path as necessary
import isAdmin from '../../middleware/adminMiddleware.js';
import { getAllImages } from '../adminDestRoutes/ejsRoutes.js';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();


router.get('/theme/theme', isAdmin, async (req, res) => {
    try {
        const [themes] = await db.query(`
            SELECT * FROM theme
        `);

        // console.log(themes, 'themes');
        res.render('admin/theme/theme', { themes });
    } catch (error) {
        // console.log(error);
        res.status(500).json({  message: err.sqlMessage,  error });
    }
});


router.get('/theme/renderEditPage/:id', isAdmin, async (req, res) => {
    const id = req.params.id;

    try {
        // 1. Get the theme by ID
        const [themeRows] = await db.query(`SELECT * FROM theme WHERE id = ?`, [id]);
        if (themeRows.length === 0) {
            return res.status(404).send({ message: "Theme not found" });
        }

        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'theme');
        const allImages = await getAllImages(uploadsDir);
        // 3. Render the edit page with both theme
        res.render('admin/theme/edit', {
            theme: themeRows[0],
            images: allImages,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({  message: err.sqlMessage,  error: err });
    }
});


router.get('/theme/renderAddPage', isAdmin, async (req, res) => {
    try {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'theme');
        const allImages = await getAllImages(uploadsDir);
        res.render('admin/theme/add', {
            breadcrumbs: [
                { label: 'Dashboard', url: '/admin/dashboard' },
                { label: 'themes', url: '/admin/theme/theme' },
                { label: 'Add theme' }
            ],
            images: allImages,
        });
    } catch (error) {
        console.error('Error rendering add page:', error);
        res.status(500).json({  message: err.sqlMessage,  error });
    }
});

router.get('/theme/renderthemeDetail/:id', isAdmin, async (req, res) => {
    const id = req.params.id;

    try {
        const [rows] = await db.query(`
            SELECT * FROM theme
            where id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).send({ message: "Theme not found" });
        }
        res.render('admin/theme/show', { theme: rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({  message: err.sqlMessage,  error: err });
    }
});


export default router;