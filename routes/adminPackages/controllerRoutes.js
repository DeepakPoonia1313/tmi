import express from 'express';
import bcrypt from 'bcrypt';
import db from '../../db.js'; // Adjust the path as necessary
import isAdmin from '../../middleware/adminMiddleware.js';
import path from 'path';
import fs from 'fs';
import { removeDataMceSrc } from '../adminDestRoutes/destControllerRoutes.js';
import createMulterMiddleware from '../../utils/multer.js';

const router = express.Router();
const upload = createMulterMiddleware();


router.post('/package/add', upload.fields([
    { name: 'image', maxCount: 1 },              // main image
    { name: 'package_images', maxCount: 10 }     // additional images
]), async (req, res) => {
    try {
        const {
            title, slug, short_description, content,
            price, inclusions, exclusions,
            featured, fixed_departure, theme,
            meta_title, meta_description, canonical_url,
            best_time, duration_days, duration_nights
        } = req.body;

        const module = req.params.module || 'package';
        const moduleId = req.params.moduleId || req.body.moduleId || 'package';

        const mainImageFile = req.files['image']?.[0];
        const additionalImages = req.files['package_images'] || [];

        const mainImagePath = mainImageFile
            ? path.join('/uploads/package', moduleId, mainImageFile.filename)
            : null;

        const cleanContent = removeDataMceSrc(content);

        // 1. Insert into `package`
        const [result] = await db.query(`
            INSERT INTO package 
            (title, slug, short_description, content, price, image,
             inclusions, exclusions, featured, fixed_departure, 
             best_time, duration_days, duration_nights)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            title, slug, short_description, cleanContent, price || 0.00,
            mainImagePath, inclusions, exclusions,
            featured || 0, fixed_departure || 0, best_time || '',
            duration_days, duration_nights
        ]);

        const packageId = result.insertId;
        // --- START: Theme Insertion Logic ---
        console.log('Received theme data (raw):', theme); // Log the raw string for debugging
        let themesToInsert = [];
        try {
            if (theme) { // Check if theme data was sent at all
                themesToInsert = JSON.parse(theme);
            }
        } catch (parseError) {
            console.error('Error parsing theme JSON:', parseError);
            // Decide how to handle a parsing error:
            // - continue without themes,
            // - send an error response,
            // - log and skip.
            // For now, we'll just log and themesToInsert will remain empty.
        }

        if (themesToInsert && themesToInsert.length > 0) {
            const insertThemeQuery = `INSERT INTO package_themes (package_id, theme_id, theme_name) VALUES (?, ?, ?)`;
            for (const themeItem of themesToInsert) {
                try {
                    await db.query(insertThemeQuery, [packageId, themeItem.id, themeItem.name]);
                    console.log(`Theme '${themeItem.name}' (ID: ${themeItem.id}) inserted for package ID: ${packageId}`);
                } catch (themeInsertError) {
                    console.error(`Error inserting theme '${themeItem.name}' for package ID ${packageId}:`, themeInsertError);
                    // You might want to log this and potentially continue,
                    // or if a single theme failing is critical, consider rolling back.
                }
            }
        } else {
            console.log('No themes selected or valid themes data to insert for package ID:', packageId);
        }
        // --- END: Theme Insertion Logic ---

        // 2. Insert metadata
        await db.query(`
            INSERT INTO metadata (module, module_id, meta_title, meta_description, canonical_url)
            VALUES (?, ?, ?, ?, ?)
        `, [module, packageId, meta_title, meta_description, canonical_url]);

        // 3. Insert additional images into `package_images`
        for (const img of additionalImages) {
            const imageUrl = path.join('/uploads/package', moduleId, img.filename);
            await db.query(`
                INSERT INTO package_images (package_id, image_url, alt_text)
                VALUES (?, ?, ?)
            `, [packageId, imageUrl, img.originalname || '']);
        }

        res.redirect('/admin/package/package');
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: err.sqlMessage || 'Something went wrong during package creation',
            error: err
        });
    }
});


router.post('/package/edit/:id', upload.fields([
    { name: 'image', maxCount: 1 },              // main image
    { name: 'package_images', maxCount: 10 }     // additional images
]), async (req, res) => {
    const packageId = req.params.id;

    try {
        const {
            title, slug, short_description, content,
            price, inclusions, exclusions,
            featured, fixed_departure, theme,
            meta_title, meta_description, canonical_url, status,
            removed_images, // comma-separated image IDs to delete
            best_time, duration_days, duration_nights
        } = req.body;

        console.log(removed_images, 'removed_images');

        const module = 'package';
        const moduleId = 'package';

        const mainImageFile = req.files['image']?.[0];
        const additionalImages = req.files['package_images'] || [];

        // 1. Get current main image to delete if replaced
        const [[existingPackage]] = await db.query(
            `SELECT image FROM package WHERE id = ?`, [packageId]
        );

        let mainImagePath = existingPackage.image;

        if (mainImageFile) {
            if (mainImagePath) {
                const fullPath = path.join('public', mainImagePath);
                if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
            }
            mainImagePath = path.join('/uploads/package', moduleId, mainImageFile.filename);
        }

        const cleanContent = removeDataMceSrc(content);

        // 2. Update `package`
        console.log(best_time, 'best_time');
        console.log(duration_days, 'duration_days');
        await db.query(`
            UPDATE package SET 
                title = ?, slug = ?, short_description = ?, content = ?, 
                price = ?, image = ?, inclusions = ?, exclusions = ?, 
                featured = ?, fixed_departure = ?, status = ?, best_time = ?,
                duration_days = ?, duration_nights = ?
            WHERE id = ?
        `, [
            title, slug, short_description, cleanContent,
            price || 0.00, mainImagePath, inclusions, exclusions,
            featured || 0, fixed_departure || 0, status || 0, best_time || '',
            duration_days, duration_nights,
            packageId
        ]);

        console.log(status, 'status');

        // --- START: Theme Update Logic ---
        console.log('Received theme data (raw) for update:', theme);
        let themesToInsert = [];
        try {
            if (theme) {
                themesToInsert = JSON.parse(theme);
            }
        } catch (parseError) {
            console.error('Error parsing theme JSON for update:', parseError);
            // Handle parsing error: for an update, you might want to return an error,
            // or proceed without updating themes if the data is corrupt.
            // For now, we'll log and themesToInsert will remain empty.
        }

        // Delete existing themes for this package first
        await db.query(`DELETE FROM package_themes WHERE package_id = ?`, [packageId]);
        console.log(`Deleted existing themes for package ID: ${packageId}`);

        // Insert currently selected themes
        if (themesToInsert && themesToInsert.length > 0) {
            const insertThemeQuery = `INSERT INTO package_themes (package_id, theme_id, theme_name) VALUES (?, ?, ?)`;
            for (const themeItem of themesToInsert) {
                try {
                    await db.query(insertThemeQuery, [packageId, themeItem.id, themeItem.name]);
                    console.log(`Theme '${themeItem.name}' (ID: ${themeItem.id}) inserted for package ID: ${packageId}`);
                } catch (themeInsertError) {
                    console.error(`Error inserting theme '${themeItem.name}' during update for package ID ${packageId}:`, themeInsertError);
                    // Log the error but continue with other themes if one fails.
                }
            }
        } else {
            console.log('No themes selected or valid themes data to insert during update for package ID:', packageId);
        }
        // --- END: Theme Update Logic ---

        // 3. Upsert metadata
        await db.query(`
            INSERT INTO metadata (module, module_id, meta_title, meta_description, canonical_url)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                meta_title = VALUES(meta_title),
                meta_description = VALUES(meta_description),
                canonical_url = VALUES(canonical_url)
        `, [module, packageId, meta_title, meta_description, canonical_url]);

        // 4. Delete selected additional images
        // if (removed_images) {
        //     console.log(`Deleting images with IDs: ${removed_images}`);
        //     const idsToDelete = removed_images.split(',').map(id => parseInt(id.trim()));
        //     for (const imageId of idsToDelete) {
        //         const [[imgRecord]] = await db.query(`SELECT image_url FROM package_images WHERE id = ?`, [imageId]);
        //         if (imgRecord) {
        //             const fullPath = path.join('public', imgRecord.image_url);
        //             await db.query(`DELETE FROM package_images WHERE id = ?`, [imageId]);
        //             if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        //         }
        //     }
        // }
        if (removed_images) {
            console.log(`Deleting images with IDs: ${removed_images}`);

            let idsToDelete = [];
            try {
                idsToDelete = JSON.parse(removed_images).map(id => parseInt(id));
            } catch (err) {
                console.error('Invalid removed_images format:', removed_images);
            }

            for (const imageId of idsToDelete) {
                if (!isNaN(imageId)) {
                    const [[imgRecord]] = await db.query(`SELECT image_url FROM package_images WHERE id = ?`, [imageId]);
                    if (imgRecord) {
                        const fullPath = path.join('public', imgRecord.image_url);
                        await db.query(`DELETE FROM package_images WHERE id = ?`, [imageId]);
                        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
                    }
                }
            }
        }


        // 5. Insert new additional images
        for (const img of additionalImages) {
            const imageUrl = path.join('/uploads', module, moduleId, img.filename);
            await db.query(`
                INSERT INTO package_images (package_id, image_url, alt_text)
                VALUES (?, ?, ?)
            `, [packageId, imageUrl, img.originalname || '']);
        }

        res.json({ success: true, message: 'Package updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err, message: 'Something went wrong during package update' });
    }
});

router.get('/package/delete/:id', isAdmin, async (req, res) => {
    const packageId = req.params.id;

    try {
        // 1. Get the package record
        const [[pkg]] = await db.query(`SELECT * FROM package WHERE id = ?`, [packageId]);
        if (!pkg) {
            return res.status(404).json({ message: 'Package not found' });
        }

        // 2. Delete main image from disk
        if (pkg.image) {
            const fullPath = path.join('public', pkg.image);
            if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        }

        // 3. Delete all additional images from disk and DB
        const [images] = await db.query(`SELECT * FROM package_images WHERE package_id = ?`, [packageId]);
        for (const img of images) {
            const fullPath = path.join('public', img.image_url);
            if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        }
        await db.query(`DELETE FROM package_images WHERE package_id = ?`, [packageId]);

        // 4. Delete themes associated with this package
        await db.query(`DELETE FROM package_theme WHERE package_id = ?`, [packageId]);

        // 4. Delete metadata
        await db.query(`DELETE FROM metadata WHERE module = ? AND module_id = ?`, ['package', packageId]);

        // 5. Delete package record
        await db.query(`DELETE FROM package WHERE id = ?`, [packageId]);

        res.status(200).json({ message: 'Package deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err, status: 'Something went wrong during package deletion' });
    }
});


export default router;