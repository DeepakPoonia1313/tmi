import express from 'express';
import db from '../../db.js'; // Adjust the path as necessary
import isAdmin from '../../middleware/adminMiddleware.js';

const router = express.Router();

// router.get('/hotel/hotel', isAdmin, async (req, res) => {
//     try {
//         const [hotels] = await db.query(`
//             SELECT * FROM hotels
//         `);

//         console.log(hotels, 'hotels');
//         res.render('admin/hotel/hotel', { hotels });
//     } catch (error) {
//         console.log(error);
//         res.status(500).send({ message: "Internal Server Error" });
//     }
// });

router.get('/hotel/hotel', isAdmin, async (req, res) => {
    try {
        const search = req.query.search || '';

        // Optionally filter the query based on the search value
        const [hotels] = await db.query(`
            SELECT * FROM hotels
            ${search ? 'WHERE name LIKE ?' : ''}
        `, search ? [`%${search}%`] : []);

        // Count total hotels for pagination
        const [[{ total }]] = await db.query(`
            SELECT COUNT(*) as total FROM hotels
            ${search ? 'WHERE name LIKE ?' : ''}
        `, search ? [`%${search}%`] : []);

        const currentPage = parseInt(req.query.page) || 1;
        const perPage = 10;
        const totalPages = Math.ceil(total / perPage);

        const [paginatedHotels] = await db.query(`
            SELECT * FROM hotels
            ${search ? 'WHERE name LIKE ?' : ''}
            LIMIT ? OFFSET ?
        `, search ? [`%${search}%`, perPage, (currentPage - 1) * perPage] : [perPage, (currentPage - 1) * perPage]);

        res.render('admin/hotel/hotel', {
            hotels: paginatedHotels,
            search,
            total,
            totalPages,
            currentPage
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});


router.get('/hotel/renderEditPage/:id', isAdmin, async (req, res) => {
    const id = req.params.id;

    try {
        // 1. Get the hotel by ID
        const [hotelRows] = await db.query(`SELECT * FROM hotels WHERE id = ?`, [id]);
        if (hotelRows.length === 0) {
            return res.status(404).send({ message: "hotel not found" });
        }

        const [hotelImages] = await db.query(`SELECT * FROM hotel_images WHERE hotel_id = ?`, [id]);
        console.log(hotelImages);
        // 2. Get all slugs
        const [cities] = await db.query('SELECT id, name FROM city');
        const [themes] = await db.query('SELECT id, name FROM theme');

        // 3. Render the edit page with both hotel and slugs
        res.render('admin/hotel/edit', {
            breadcrumbs: [
                { label: 'Dashboard', url: '/admin/dashboard' },
                { label: 'hotels', url: '/admin/hotel/hotel' },
                { label: 'Edit hotel' }
            ],
            hotel: hotelRows[0],
            cities,
            themes,
            hotelImages
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Error fetching data" });
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
        res.status(500).json({ message: 'Internal server error' });
    }
});


router.get('/hotel/renderAddPage', async (req, res) => {
    try {
        const [hotelImages] = await db.query('SELECT * FROM hotel_images');
        console.log(" hotelImages => ", hotelImages);
        const [cities] = await db.query('SELECT id, name FROM city');
        const [themes] = await db.query('SELECT id, name FROM theme');
        res.render('admin/hotel/add', {
            breadcrumbs: [
                { label: 'Dashboard', url: '/admin/dashboard' },
                { label: 'hotels', url: '/admin/hotel/hotel' },
                { label: 'Add hotel' }
            ],
            cities,
            themes
        });
    } catch (error) {
        console.error('Error rendering add page:', error);
        res.status(500).send({ message: 'Internal server error' });
    }
});


// slug
router.get('/hotel/renderhotelDetail/:id', isAdmin, async (req, res) => {
    const id = req.params.id;

    try {
        const [rows] = await db.query(`
            SELECT * FROM hotel
            WHERE hotel.id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).send({ message: "hotel not found" });
        }
        // console.log(rows)
        res.render('admin/hotel/show', { hotel: rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Error fetching data" });
    }
});

export default router;