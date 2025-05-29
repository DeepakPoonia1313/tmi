import express from 'express';
import bcrypt from 'bcrypt';
import db from '../../db.js'; // Adjust the path as necessary
import isAdmin from '../../middleware/adminMiddleware.js';
import createDynamicMulterMiddleware from '../../utils/multerDestinaProps.js';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const dynamicImageUpload = createDynamicMulterMiddleware();


router.post('/package/add', isAdmin, dynamicImageUpload.single('image'), async (req, res) => {
    const {
        title,
        slug,
        short_description,
        long_description,
        content,
        price,
        // feature_image,
        featured,
        fixed_departure,
        meta_title,
        meta_description,
        meta_keywords,
        theme_ids = [] // this should be an array of theme IDs from the form
    } = req.body;

    const image = req.filePath || req.body.image || null;

    try {
        if (!title || !slug) {
            return res.status(400).send('Title and slug are required.');
        }

        // Insert package
        const [result] = await db.query(`
            INSERT INTO package (
                title, slug, short_description, long_description,
                content, price, image,
                featured, fixed_departure,
                meta_title, meta_description, meta_keywords
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            title,
            slug,
            short_description || null,
            long_description || null,
            content || null,
            price || 0.00,
            image,
            // feature_image || null,
            featured ? 1 : 0,
            fixed_departure ? 1 : 0,
            meta_title || null,
            meta_description || null,
            meta_keywords || null
        ]);

        const packageId = result.insertId;

        // Insert into pivot table (package_themes)
        if (Array.isArray(theme_ids) && theme_ids.length > 0) {
            const themeInsertValues = theme_ids.map(themeId => [packageId, themeId]);
            await db.query(
                `INSERT INTO package_themes (package_id, theme_id) VALUES ?`,
                [themeInsertValues]
            );
        }

        console.log('Package created with ID:', packageId);
        res.redirect('/admin/package/package');
    } catch (err) {
        console.error(err);
        if (err.code === 'ER_DUP_ENTRY') {
            res.status(400).send('Title or slug must be unique.');
        } else {
            res.status(500).send('Error saving package.');
        }
    }
});

export default router;