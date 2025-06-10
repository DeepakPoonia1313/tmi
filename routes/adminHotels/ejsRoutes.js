import express from 'express';
import db from '../../db.js'; // Adjust the path as necessary
import isAdmin from '../../middleware/adminMiddleware.js';
import { getAllImages } from '../adminDestRoutes/ejsRoutes.js';
import path from 'path';

const router = express.Router();


router.get('/hotel/hotel', isAdmin, async (req, res) => {
    try {
        const search = req.query.search || '';
        const currentPage = parseInt(req.query.page) || 1;
        const perPage = 10;
        const offset = (currentPage - 1) * perPage;

        // Query for filtered hotels
        const searchQuery = search ? `%${search}%` : '%';

        const [hotels] = await db.query(
            `SELECT * FROM hotels WHERE name LIKE ? LIMIT ? OFFSET ?`,
            [searchQuery, perPage, offset]
        );

        // Query for total count
        const [[{ total }]] = await db.query(
            `SELECT COUNT(*) as total FROM hotels WHERE name LIKE ?`,
            [searchQuery]
        );

        const totalPages = Math.ceil(total / perPage);

        // If it's an AJAX request, return JSON
        if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
            return res.json({
                hotels,
                total,
                totalPages,
                currentPage,
                search
            });
        }

        // Otherwise, render the EJS page
        res.render('admin/hotel/hotel', {
            hotels,
            total,
            totalPages,
            currentPage,
            search
        });

    } catch (error) {
        console.error('Error fetching hotels:', error);
        res.status(500).json({ message: error.sqlMessage, 'Server error': error });
    }
});

router.get('/api/cities', async (req, res) => {
    const search = req.query.q || '';
    try {
        const [rows] = await db.query(
            'SELECT id, name FROM city WHERE name LIKE ? LIMIT 20',
            [`%${search}%`]
        );
        const results = rows.map(city => ({
            id: city.id,
            text: city.name
        }));
        res.json({ results });
    } catch (error) {
        console.error('Error fetching cities:', error);
        res.status(500).json({ message: error.sqlMessage, error: error });
    }
});

router.get('/api/hotels', async (req, res) => {
    const search = req.query.q || '';
    try {
        const [rows] = await db.query(
            'SELECT id, name FROM hotels WHERE name LIKE ? LIMIT 20',
            [`%${search}%`]
        );
        const results = rows.map(hotel => ({
            id: hotel.id,
            text: hotel.name
        }));
        res.json({ results });
    } catch (error) {
        console.error('Error fetching cities:', error);
        res.status(500).json({ message: error.sqlMessage, error: error });
    }
});


router.get('/hotel/renderAddPage', async (req, res) => {
    try {
        // const [hotelImages] = await db.query('SELECT * FROM hotel_images');
        // console.log(" hotelImages => ", hotelImages);
        // const [cities] = await db.query('SELECT id, name FROM city');
        const [themes] = await db.query('SELECT id, name FROM theme');
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'hotel');
        const allImages = await getAllImages(uploadsDir);
        res.render('admin/hotel/add', {
            breadcrumbs: [
                { label: 'Dashboard', url: '/admin/dashboard' },
                { label: 'hotels', url: '/admin/hotel/hotel' },
                { label: 'Add hotel' }
            ],
            // cities,
            themes,
            images: allImages
        });
    } catch (error) {
        console.error('Error rendering add page:', error);
        res.status(500).json({ message: error.sqlMessage, error });
    }
});

router.get('/hotel/renderEditPage/:id', isAdmin, async (req, res) => {
    const id = req.params.id;

    try {
        // 1. Get the hotel by ID including metadata
        const [hotelRows] = await db.query(`
            SELECT 
                h.*, 
                c.name AS city_name,
                m.meta_title,
                m.meta_description,
                m.canonical_url
            FROM hotels h
            LEFT JOIN city c ON h.city_id = c.id
            LEFT JOIN metadata m ON m.module = 'hotel' AND m.module_id = h.id
            WHERE h.id = ?
        `, [id]);

        if (hotelRows.length === 0) {
            return res.status(404).send({ message: "hotel not found" });
        }

        // 2. Get all hotel images
        const [hotelImages] = await db.query(`SELECT * FROM hotel_images WHERE hotel_id = ?`, [id]);

        // 3. Get all themes (optional dropdown)
        const [themes] = await db.query('SELECT id, name FROM theme');

        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'hotel');
        const allImages = await getAllImages(uploadsDir);
        // 4. Render the edit page
        res.render('admin/hotel/edit', {
            breadcrumbs: [
                { label: 'Dashboard', url: '/admin/dashboard' },
                { label: 'hotels', url: '/admin/hotel/hotel' },
                { label: 'Edit hotel' }
            ],
            hotel: hotelRows[0],
            themes,
            hotelImages,
            images: allImages
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.sqlMessage, error: err });
    }
});

router.get('/hotel/renderHotelDetail/:id', async (req, res) => {
    const id = req.params.id;

    try {
        const [rows] = await db.query(`
            SELECT 
                h.*, 
                m.meta_title, 
                m.meta_description, 
                m.canonical_url
            FROM hotels h
            LEFT JOIN metadata m ON m.module = 'hotel' AND m.module_id = h.id
            WHERE h.id = ?
        `, [id]);
        const [hotelImages] = await db.query(`SELECT * FROM hotel_images WHERE hotel_id = ?`, [id]);
        if (rows.length === 0) {
            return res.status(404).send({ message: "hotel not found" });
        }

        res.render('admin/hotel/show', {
            hotel: rows[0],
            hotelImages
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.sqlMessage, error: err });
    }
});

export default router;