import express from 'express';
import bcrypt from 'bcrypt';
import db from '../../db.js'; // Adjust the path as necessary
import isAdmin from '../../middleware/adminMiddleware.js';
import jwt from "jsonwebtoken";
import fs from 'fs/promises';
import path from 'path';
import { getAllImages } from '../adminDestRoutes/ejsRoutes.js';

const router = express.Router();

router.get('/itinerary/renderAddPage', isAdmin, async (req, res) => {
    const [cities] = await db.query('SELECT * FROM city');
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'itinerary');
    const allImages = await getAllImages(uploadsDir);
    const [themes] = await db.query('SELECT * FROM theme');
    // console.log(states);
    res.render('admin/itinerary/add', {
        breadcrumbs: [
            { label: 'Dashboard', url: '/admin/dashboard' },
            { label: 'itinerary', url: '/admin/itinerary/itinerary' },
            { label: 'Add itinerary' }
        ],
        images: allImages,
        themes: themes
    });
})

// routes/itinerary.js or inside your main router
router.get('/itinerary/packageItineraries/:package_id', isAdmin, async (req, res) => {
    const { package_id } = req.params;

    try {
        const [itineraries] = await db.query(`
            SELECT 
                pi.id,
                pi.day_number,
                pi.distance,
                pi.duration,
                pi.content,
                p.title AS package_title,
                cf.name AS city_from,
                ct.name AS city_to,
                h.name AS hotel_name,
                t.name AS theme_name
            FROM package_itinerary pi
            LEFT JOIN package p ON pi.package_id = p.id
            LEFT JOIN city cf ON pi.location_from = cf.id
            LEFT JOIN city ct ON pi.location_to = ct.id
            LEFT JOIN hotels h ON pi.hotel_id = h.id
            LEFT JOIN theme t ON pi.theme_id = t.id
            WHERE pi.package_id = ?
            ORDER BY pi.day_number ASC
        `, [package_id]);

        res.render('admin/itinerary/show', {
            package_id,
            itineraries
        });
    } catch (error) {
        console.error('Error fetching itineraries:', error);
        res.status(500).send('Error loading itinerary details.');
    }
});


router.get('/itinerary/itinerary', isAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        let query = `
            SELECT 
                p.id AS package_id,
                p.title AS package_title,
                COUNT(pi.id) AS itinerary_count
            FROM package p
            INNER JOIN package_itinerary pi ON pi.package_id = p.id
        `;

        if (search) {
            query += ` WHERE p.title LIKE ? `;
        }

        query += `
            GROUP BY p.id
            ORDER BY p.id DESC
            LIMIT ? OFFSET ?
        `;

        let countQuery = `
            SELECT COUNT(DISTINCT p.id) as total
            FROM package p
            INNER JOIN package_itinerary pi ON pi.package_id = p.id
        `;

        if (search) {
            countQuery += ` WHERE p.title LIKE ? `;
        }

        let queryParams = [];
        let countParams = [];

        if (search) {
            const searchTerm = `%${search}%`;
            queryParams = [searchTerm, limit, offset];
            countParams = [searchTerm];
        } else {
            queryParams = [limit, offset];
        }

        const [packages] = await db.query(query, queryParams);
        const [[totalCount]] = await db.query(countQuery, countParams);
        const total = totalCount.total;
        const totalPages = Math.ceil(total / limit);

        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.json({
                packages,
                total,
                totalPages,
                currentPage: page,
                search
            });
        }

        res.render('admin/itinerary/itinerary', {
            breadcrumbs: [
                { label: 'Dashboard', url: '/admin/dashboard' },
                { label: 'Itinerary', url: '/admin/itinerary/itinerary' }
            ],
            packages: packages,
            total: total,
            currentPage: page,
            totalPages: totalPages,
            search: search,
            limit: limit
        });

    } catch (err) {
        console.error(err);
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(500).json({ message: "Error fetching data", error: err });
        }
        res.status(500).render('error', { error: err });
    }
});


router.get('/itinerary/renderEditPage/:package_id', isAdmin, async (req, res) => {
    const { package_id } = req.params;

    try {
        // Fetch all images for image selection
        const [themes] = await db.query('SELECT * FROM theme');
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'itinerary');
        const allImages = await getAllImages(uploadsDir);

        // Fetch itineraries with joined details
        const [itineraries] = await db.query(`
            SELECT 
                pi.id,
                pi.day_number,
                pi.location_from,
                cf.name AS city_from,
                pi.location_to,
                ct.name AS city_to,
                pi.distance,
                pi.duration,
                pi.content,
                pi.theme_id,
                t.name AS theme_name,
                pi.hotel_id,
                h.name AS hotel_name,
                p.title AS package_title
            FROM package_itinerary pi
            LEFT JOIN city cf ON pi.location_from = cf.id
            LEFT JOIN city ct ON pi.location_to = ct.id
            LEFT JOIN theme t ON pi.theme_id = t.id
            LEFT JOIN hotels h ON pi.hotel_id = h.id
            LEFT JOIN package p ON pi.package_id = p.id
            WHERE pi.package_id = ?
            ORDER BY pi.day_number ASC
        `, [package_id]);
        console.log(itineraries , "itineraries for package_id:", package_id);

        // Render edit page
        res.render('admin/itinerary/edit', {
            breadcrumbs: [
                { label: 'Dashboard', url: '/admin/dashboard' },
                { label: 'Itinerary', url: '/admin/itinerary/itinerary' },
                { label: `Edit Itinerary for ${itineraries[0]?.package_title || 'Package'}` }
            ],
            package_id,
            itineraries,
            images: allImages,
            themes: themes
        });

    } catch (error) {
        console.error('Error rendering itinerary edit page:', error);
        res.status(500).send('Error loading edit page.');
    }
});


export default router;