import express from 'express';
import bcrypt from 'bcrypt';
import db from '../../db.js'; // Adjust the path as necessary
import isAdmin from '../../middleware/adminMiddleware.js';
import path from 'path';
import fs from 'fs';
import createMulterMiddleware from '../../utils/multer.js';
import { removeDataMceSrc } from '../adminDestRoutes/destControllerRoutes.js';

const router = express.Router();
const upload = createMulterMiddleware();

router.post('/hotel/add', upload.fields([
    { name: 'image', maxCount: 1 },           // main image
    { name: 'hotel_images', maxCount: 9 }     // additional images
]), async (req, res) => {
    try {
        const {
            name, slug, address, city_id, phone, email, website,
            star_rating, price_per_night, description, content,
            meta_title, meta_description, canonical_url,
            is_featured, is_active, theme_id
        } = req.body;

        const module = req.params.module || 'hotel';
        const moduleId = req.params.moduleId || 'hotel';

        const mainImageFile = req.files['image']?.[0];
        const additionalImages = req.files['hotel_images'] || [];

        const mainImagePath = mainImageFile
            ? path.join('/uploads/hotel', moduleId, mainImageFile.filename)
            : null;

        const cleanContent = removeDataMceSrc(content);
        const [result] = await db.query(`
    INSERT INTO hotels 
    (name, slug, address, city_id, phone, email, website, star_rating,
    price_per_night, description, content, is_featured, is_active, theme_id, mainImage) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`, [
            name, slug, address, city_id, phone, email, website, star_rating,
            price_per_night, description, cleanContent,
            is_featured || 0, is_active || 1, theme_id, mainImagePath
        ]);

        const hotelId = result.insertId;

        // 💾 Insert metadata separately
        await db.query(`
    INSERT INTO metadata (module, module_id, meta_title, meta_description, canonical_url)
    VALUES (?, ?, ?, ?, ?)
`, ['hotel', hotelId, meta_title, meta_description, canonical_url]);


        // 2. Insert additional images into hotel_images
        for (const img of additionalImages) {
            const imageUrl = path.join('/uploads', module, moduleId, img.filename);
            await db.query(`
                INSERT INTO hotel_images (hotel_id, image_url, is_featured) 
                VALUES (?, ?, ?)
            `, [hotelId, imageUrl, 0]);
        }

        res.redirect('/admin/hotel/hotel');
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err, 'Something went wrong during hotel creation': err });
    }
});

router.post('/hotel/edit/:id', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'hotel_images', maxCount: 9 }
]), async (req, res) => {
    const hotelId = req.params.id;

    try {
        const {
            name, slug, address, city_id, phone, email, website,
            star_rating, price_per_night, description, content,
            meta_title, meta_description, canonical_url,
            is_featured, is_active, theme_id,
            delete_image_ids // comma-separated string of hotel_images.id to delete
        } = req.body;

        const module = 'hotel';
        const moduleId = 'hotel';

        const mainImageFile = req.files['image']?.[0];
        const additionalImages = req.files['hotel_images'] || [];

        // 1. Get current main image to delete if replaced
        const [[existingHotel]] = await db.query(
            `SELECT mainImage FROM hotels WHERE id = ?`, [hotelId]
        );

        let mainImagePath = existingHotel.mainImage;

        if (mainImageFile) {
            if (mainImagePath) {
                const fullPath = path.join('public', mainImagePath);
                if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
            }
            // Set new image path
            mainImagePath = path.join('/uploads', module, moduleId, mainImageFile.filename);
        }


        const cleanContent = removeDataMceSrc(content);
        await db.query(`
    UPDATE hotels SET 
        name = ?, slug = ?, address = ?, city_id = ?, phone = ?, email = ?, website = ?, 
        star_rating = ?, price_per_night = ?, description = ?, content = ?, 
        is_featured = ?, is_active = ?, theme_id = ?, mainImage = ?
    WHERE id = ?
`, [
            name, slug, address, city_id, phone, email, website,
            star_rating, price_per_night, description, cleanContent,
            is_featured || 0, is_active || 1, theme_id, mainImagePath,
            hotelId
        ]);

        // 💾 Update or insert metadata
        await db.query(`
    INSERT INTO metadata (module, module_id, meta_title, meta_description, canonical_url)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
        meta_title = VALUES(meta_title),
        meta_description = VALUES(meta_description),
        canonical_url = VALUES(canonical_url)
`, ['hotel', hotelId, meta_title, meta_description, canonical_url]);


        // 4. Delete selected images from DB and disk
        if (delete_image_ids) {
            const idsToDelete = delete_image_ids.split(',').map(id => parseInt(id.trim()));
            for (const imageId of idsToDelete) {
                const [[imgRecord]] = await db.query(`SELECT image_url FROM hotel_images WHERE id = ?`, [imageId]);
                if (imgRecord) {
                    const fullPath = path.join('public', imgRecord.image_url);
                    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
                    await db.query(`DELETE FROM hotel_images WHERE id = ?`, [imageId]);
                }
            }
        }

        // 5. Insert new additional images
        for (const img of additionalImages) {
            const imageUrl = path.join('/uploads', module, moduleId, img.filename);
            await db.query(`
                INSERT INTO hotel_images (hotel_id, image_url, is_featured)
                VALUES (?, ?, ?)
            `, [hotelId, imageUrl, 0]);
        }

        // res.redirect('/admin/hotel/hotel');
        res.json({ success: true, message: 'Hotel updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err, message: err, status: 'something went wrong' });
    }
});

router.get('/hotel/delete/:id', isAdmin, async (req, res) => {
    const hotelId = req.params.id;

    try {
        // 1. Get the hotel record to delete
        const [[hotel]] = await db.query(`SELECT * FROM hotels WHERE id = ?`, [hotelId]);
        if (!hotel) {
            return res.status(404).json({ message: 'Hotel not found' });
        }

        // 2. Delete main image from disk
        if (hotel.mainImage) {
            const fullPath = path.join('public', hotel.mainImage);
            if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        }

        // 3. Delete all additional images from disk and DB
        const [images] = await db.query(`SELECT * FROM hotel_images WHERE hotel_id = ?`, [hotelId]);
        for (const img of images) {
            const fullPath = path.join('public', img.image_url);
            if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        }
        await db.query(`DELETE FROM hotel_images WHERE hotel_id = ?`, [hotelId]);
        await db.query(`DELETE FROM metadata WHERE module = ? AND module_id = ?`, ['hotel', hotelId]);

        // 4. Delete the hotel record
        await db.query(`DELETE FROM hotels WHERE id = ?`, [hotelId]);

        // res.redirect('/admin/hotel/hotel');
        res.status(200).json({ message: 'Hotel deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err, status: 'something went wrong' });
    }
});

export default router;