import express from 'express';
import bcrypt from 'bcrypt';
import db from '../../db.js'; // Adjust the path as necessary
import isAdmin from '../../middleware/adminMiddleware.js';
import path from 'path';
import fs from 'fs';
import createMulterMiddleware from '../../utils/multer.js';

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
            meta_title, meta_description, meta_keywords,
            is_featured, is_active, theme_id
        } = req.body;

        const module = req.params.module || 'hotel';
        const moduleId = req.params.moduleId || 'hotel';

        const mainImageFile = req.files['image']?.[0];
        const additionalImages = req.files['hotel_images'] || [];

        const mainImagePath = mainImageFile
            ? path.join('/uploads/hotel', moduleId, mainImageFile.filename)
            : null;

        // 1. Insert into hotels table
        const [result] = await db.query(`
            INSERT INTO hotels 
            (name, slug, address, city_id, phone, email, website, star_rating,
            price_per_night, description, content, meta_title, meta_description, meta_keywords,
            is_featured, is_active, theme_id, mainImage) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            name, slug, address, city_id, phone, email, website, star_rating,
            price_per_night, description, content, meta_title, meta_description, meta_keywords,
            is_featured || 0, is_active || 1, theme_id, mainImagePath
        ]);

        const hotelId = result.insertId;

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
        res.status(500).send({'Something went wrong': err});
    }
});

router.post('/hotel/edit/:id', upload.fields([
    { name: 'image', maxCount: 1 },           // main image
    { name: 'hotel_images', maxCount: 9 }     // additional images
]), async (req, res) => {
    const hotelId = req.params.id;

    try {
        const {
            name, slug, address, city_id, phone, email, website,
            star_rating, price_per_night, description, content,
            meta_title, meta_description, meta_keywords,
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

        // 2. Replace main image if new one is uploaded
        if (mainImageFile) {
            // Delete old main image from disk
            if (mainImagePath) {
                const fullPath = path.join('public', mainImagePath);
                if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
            }
            // Set new image path
            mainImagePath = path.join('/uploads', module, moduleId, mainImageFile.filename);
        }

        // 3. Update hotel record
        await db.query(`
            UPDATE hotels SET 
                name = ?, slug = ?, address = ?, city_id = ?, phone = ?, email = ?, website = ?, 
                star_rating = ?, price_per_night = ?, description = ?, content = ?, 
                meta_title = ?, meta_description = ?, meta_keywords = ?, 
                is_featured = ?, is_active = ?, theme_id = ?, mainImage = ?
            WHERE id = ?
        `, [
            name, slug, address, city_id, phone, email, website,
            star_rating, price_per_night, description, content,
            meta_title, meta_description, meta_keywords,
            is_featured || 0, is_active || 1, theme_id, mainImagePath,
            hotelId
        ]);

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

        res.redirect('/admin/hotel/hotel');
    } catch (err) {
        console.error(err);
        res.status(500).send({ 'Something went wrong during hotel update': err });
    }
});


export default router;