import express from 'express';
import bcrypt from 'bcrypt';
import db from '../../db.js'; // Adjust the path as necessary
import isAdmin from '../../middleware/adminMiddleware.js';
import createDynamicMulterMiddleware from '../../utils/multerDestinaProps.js';
import path from 'path';
import fs from 'fs';
import { removeDataMceSrc } from '../adminDestRoutes/destControllerRoutes.js';

const router = express.Router();
const dynamicImageUpload = createDynamicMulterMiddleware();


router.post('/theme/add', isAdmin, dynamicImageUpload.single('image'), async (req, res) => {
    const {
        name,
        slug,
        description,
        content,
        meta_title,
        meta_description,
        canonical_url,
        image
    } = req.body;

    try {
        if (!name || !slug || (!image && !req.filePath)) {
            return res.status(400).json({ message: 'Name, Image and slug fields cannot be Empty.' });
        }

        const cleanContent = removeDataMceSrc(content);

        const [result] = await db.query(`
            INSERT INTO theme (
                name, slug, description, content,
                meta_title, meta_description, canonical_url, image
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            name,
            slug,
            description || null,
            cleanContent || null,
            meta_title || null,
            meta_description || null,
            canonical_url || null,
            req.filePath || image || null
        ]);

        // console.log(result, '<= Theme insert result');

        // res.redirect('/admin/theme/theme');
        res.status(200).json({ message: 'Theme added successfully', success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.sqlMessage, 'Error saving theme.': err });
    }
});

router.post('/theme/update/:id', isAdmin, dynamicImageUpload.single('image'), async (req, res) => {
    try {
        const {
            name,
            slug,
            description,
            content,
            meta_title,
            meta_description,
            canonical_url
        } = req.body;
        const id = req.params.id;

        const image = req.filePath; // might be undefined if no new image uploaded

        if (!id) {
            return res.status(400).json({ message: "Missing theme ID" });
        }

        // Build update query dynamically only for fields present
        const fields = [];
        const values = [];

        if (name !== undefined) {
            fields.push('name = ?');
            values.push(name);
        }
        if (slug !== undefined) {
            fields.push('slug = ?');
            values.push(slug);
        }
        if (canonical_url !== undefined) {
            fields.push('canonical_url = ?');
            values.push(canonical_url);
        }
        if (description !== undefined) {
            fields.push('description = ?');
            values.push(description);
        }
        if (meta_title !== undefined) {
            fields.push('meta_title = ?');
            values.push(meta_title);
        }
        if (meta_description !== undefined) {
            fields.push('meta_description = ?');
            values.push(meta_description);
        }
        if (image !== undefined) {
            fields.push('image = ?');
            values.push(image);
        }
        if (content !== undefined) {
            fields.push('content = ?');
            values.push(content);
        }

        if (fields.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        values.push(id);

        let oldImagePath;
        if (image) {
            const [rows] = await db.query('SELECT image FROM theme WHERE id = ?', [id]);
            if (rows.length > 0) {
                oldImagePath = rows[0].image;
                // console.log(image, oldImagePath);
            }
        }

        if (image && oldImagePath && oldImagePath !== image) {
            const fullOldImagePath = path.join(process.cwd(), 'public', oldImagePath);
            // console.log(fullOldImagePath);
            fs.unlink(fullOldImagePath, (err) => {
                if (err) console.error('Error deleting old image:', err);
                else console.log('Old image deleted:', fullOldImagePath);
            });
        }

        const updateQuery = `UPDATE theme SET ${fields.join(', ')} WHERE id = ?`;

        await db.execute(updateQuery, values);

        return res.status(200).json({
            success: true,
            message: 'Theme updated successfully'
        });
        // if (req.headers.accept.includes('application/json')) {
        //     return res.status(200).json({ success: true, message: 'Theme updated successfully' });
        // } else {
        //     return res.redirect('/admin/theme/theme');
        // }

    } catch (err) {
        console.error('Error updating theme:', err);
        return res.status(500).json({
            success: false,
            message: err.sqlMessage || 'Error updating theme'
        });
    }
});

router.post('/theme/delete/:id', isAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        // console.log("admin is deleting a theme in the dest controller =>", id);
        const [rows] = await db.query('SELECT image FROM theme WHERE id = ?', [id]);
        if (rows.length > 0) {
            const fullImagePath = path.join(process.cwd(), 'public', rows[0].image);
            fs.unlink(fullImagePath, (err) => {
                console.error(err)
            })
        }
        await db.query('DELETE FROM theme WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting theme:', error);
        res.status(500).json({ message: err.sqlMessage, error });
    }
})


export default router;