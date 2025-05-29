import express from 'express';
import bcrypt from 'bcrypt';
import db from '../../db.js'; // Adjust the path as necessary
import isAdmin from '../../middleware/adminMiddleware.js';
import jwt from "jsonwebtoken";


const router = express.Router();

router.get('/region/region', isAdmin, async (req, res) => {
    try {
        const [regions] = await db.query('SELECT * FROM region');
        console.log(regions, 'regions');
        res.render('admin/region/region', { regions });
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Internal Server Error" });
    }
})

router.get('/region/renderEditPage/:id', isAdmin, async (req, res) => {
    const id = req.params.id;
    // const id = 1;
    try {
        const [rows] = await db.query(`SELECT * FROM region WHERE id = ?`, [id]);
        if (rows.length === 0) {
            return res.status(404).send({ message: "Region not found" });
        }
        res.render('admin/region/edit', { region: rows[0] });
    } catch (err) {
        console.log(err);
        res.status(500).send({ message: "Error fetching data" });
    }
    // res.render('admin/region/edit', { region: result.rows[0] });
})

router.get('/region/renderAddPage', isAdmin, (req, res) => {
    res.render('admin/region/add', {
        breadcrumbs: [
            { label: 'Dashboard', url: '/admin/dashboard' },
            { label: 'Regions', url: '/admin/region/region' },
            { label: 'Add Region' }
        ]
    });
});

router.get('/region/renderRegionDetail/:id', isAdmin, async (req, res) => {
    const id = req.params.id;
    // const id = 1;
    try {
        const [rows] = await db.query(`SELECT * FROM region WHERE id = ?`, [id]);
        if (rows.length === 0) {
            return res.status(404).send({ message: "Region not found" });
        }
        res.render('admin/region/details', { region: rows[0] });
    } catch (err) {
        console.log(err);
        res.status(500).send({ message: "Error fetching data" });
    }
})


// state routes

router.get('/state/renderAddPage', isAdmin, async (req, res) => {
    const [regions] = await db.query('SELECT * FROM region');
    res.render('admin/state/add', {
        breadcrumbs: [
            { label: 'Dashboard', url: '/admin/dashboard' },
            { label: 'States', url: '/admin/state/state' },
            { label: 'Add State' }
        ],
        regions: regions
    });

})

router.get('/state/renderStateDetail/:id', isAdmin, async (req, res) => {
    const id = req.params.id;
    // const id = 1;
    try {
        const [rows] = await db.query(
            `SELECT state.*, region.name AS region_name 
             FROM state 
             LEFT JOIN region ON state.region_id = region.id 
             WHERE state.id = ?`,
            [id]);
        if (rows.length === 0) {
            return res.status(404).send({ message: "State not found" });
        }
        res.render('admin/state/show', { state: rows[0] });
    } catch (err) {
        console.log(err);
        res.status(500).send({ message: "Error fetching data" });
    }
})

router.get('/state/state', isAdmin, async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT s.*, r.name AS region_name
            FROM state s
            JOIN region r ON s.region_id = r.id
        `);
        res.render('admin/state/state', { states: rows });
    } catch (err) {
        console.log(err);
        res.status(500).send({ message: "Error fetching data" });
    }
});

router.get('/state/renderEditPage/:id', isAdmin, async (req, res) => {
    // const id = 1;
    const id = req.params.id;
    try {
        const [rows] = await db.query(
            `SELECT state.*, region.name AS region_name
             FROM state
             LEFT JOIN region ON state.region_id = region.id
             WHERE state.id = ?`,
            [id]);
        if (rows.length === 0) {
            return res.status(404).send({ message: "State not found" });
        }
        res.render('admin/state/edit',
            { state: rows[0] }
        );
    } catch (err) {
        console.log(err);
        res.status(500).send({ message: "Error fetching data" });
    }
})

// city routes
router.get('/city/renderAddPage', isAdmin, async (req, res) => {
    const [states] = await db.query('SELECT * FROM state');
    console.log(states);
    res.render('admin/city/add', {
        breadcrumbs: [
            { label: 'Dashboard', url: '/admin/dashboard' },
            { label: 'city', url: '/admin/city/city' },
            { label: 'Add city' }
        ],
        states: states
    });

})

router.get('/city/rendercityDetail/:id', isAdmin, async (req, res) => {
    const id = req.params.id;
    // const id = 1;
    try {
        const [rows] = await db.query(
            `SELECT city.*, state.name AS state_name 
             FROM city 
             LEFT JOIN state ON city.state_id = state.id 
             WHERE city.id = ?`,
            [id]);
        if (rows.length === 0) {
            return res.status(404).send({ message: "city not found" });
        }
        res.render('admin/city/show', { city: rows[0] });
    } catch (err) {
        console.log(err);
        res.status(500).send({ message: "Error fetching data" });
    }
})

// router.get('/city/city', isAdmin, async (req, res) => {
//     try {
//         const [rows] = await db.query(`
//             SELECT s.*, r.name AS state_name
//             FROM city s
//             JOIN state r ON s.state_id = r.id
//         `);
//         res.render('admin/city/city', { city: rows });
//     } catch (err) {
//         console.log(err);
//         res.status(500).send({ message: "Error fetching data" });
//     }
// });

router.get('/city/city', isAdmin, async (req, res) => {
    try {
        const search = req.query.search || '';
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const [countResult] = await db.query(`
            SELECT COUNT(*) AS total 
            FROM city c
            JOIN state s ON c.state_id = s.id
            WHERE c.name LIKE ?
        `, [`%${search}%`]);
        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        const [rows] = await db.query(`
            SELECT c.*, s.name AS state_name
            FROM city c
            JOIN state s ON c.state_id = s.id
            WHERE c.name LIKE ?
            ORDER BY c.updated_at DESC
            LIMIT ? OFFSET ?
        `, [`%${search}%`, limit, offset]);

        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.json({
                city: rows,
                total,
                totalPages,
                currentPage: page,
                search
            });
        }

        res.render('admin/city/city', {
            city: rows,
            total,
            totalPages,
            currentPage: page,
            search
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Error fetching data" });
    }
});



router.get('/city/renderEditPage/:id', isAdmin, async (req, res) => {
    // const id = 1;
    const id = req.params.id;
    try {
        const [rows] = await db.query(
            `SELECT city.*, state.name AS state_name
             FROM city
             LEFT JOIN state ON city.state_id = state.id
             WHERE city.id = ?`,
            [id]);
        if (rows.length === 0) {
            return res.status(404).send({ message: "city not found" });
        }
        res.render('admin/city/edit',
            { city: rows[0] }
        );
    } catch (err) {
        console.log(err);
        res.status(500).send({ message: "Error fetching data" });
    }
})

export default router;