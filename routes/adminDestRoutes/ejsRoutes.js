import express from 'express';
import bcrypt from 'bcrypt';
import db from '../../db.js'; // Adjust the path as necessary
import isAdmin from '../../middleware/adminMiddleware.js';
import jwt from "jsonwebtoken";
import fs from 'fs/promises';
import path from 'path';

export const getAllImages = async (dir, root = dir) => {
    let images = [];

    if (!dir || !root) {
        dir = path.join(process.cwd(), 'public', 'uploads');
        root = dir;
    }

    try {
        await fs.mkdir(dir, { recursive: true });
    } catch (err) {
        console.error(`Failed to create directory ${dir}:`, err);
        return images;
    }

    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            const subImages = await getAllImages(fullPath, root);
            images.push(...subImages);
        } else if (entry.isFile() && /\.(png|jpe?g|webp|gif)$/i.test(entry.name)) {
            const relativePath = path.relative(path.join(process.cwd(), 'public', 'uploads'), fullPath).replace(/\\/g, '/');
            images.push(`/uploads/${relativePath}`);
        }
    }

    return images;
};


const router = express.Router();

router.get('/region/region', isAdmin, async (req, res) => {
    try {
        const [regions] = await db.query('SELECT * FROM region');
        // console.log(regions, 'regions');
        res.render('admin/region/region', { regions });
    } catch (error) {
        // console.log(error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
})


router.get('/region/renderEditPage/:id', isAdmin, async (req, res) => {
    const id = req.params.id;
    try {
        const [rows] = await db.query(`
            SELECT region.*, metadata.meta_title, metadata.meta_description, metadata.canonical_url
            FROM region
            LEFT JOIN metadata ON metadata.module = 'region' AND metadata.module_id = region.id
            WHERE region.id = ?
        `, [id]);

        const [featuredPackages] = await db.query(
            `SELECT 
      lfp.package_id AS id, 
      lfp.order_number, 
      p.title AS text, 
      p.image AS img
   FROM location_featured_packages lfp
   JOIN package p ON lfp.package_id = p.id
   WHERE lfp.module_name = 'region' AND lfp.module_id = ?
   ORDER BY lfp.order_number ASC`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).send({ message: "Region not found" });
        }

        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'region');
        const allImages = await getAllImages(uploadsDir);

        res.render('admin/region/edit', {
            region: rows[0],
            images: allImages,
            selectedFeaturedPackages: JSON.stringify(featuredPackages)
        });
    } catch (err) {
        // console.log(err);
        res.status(500).json({ message: "Error fetching data", error: err });
    }
});


router.get('/region/renderAddPage', isAdmin, async (req, res) => {
    try {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'region');
        const allImages = await getAllImages(uploadsDir);

        res.render('admin/region/add', {
            breadcrumbs: [
                { label: 'Dashboard', url: '/admin/dashboard' },
                { label: 'Regions', url: '/admin/region/region' },
                { label: 'Add Region' }
            ],
            images: allImages,
        });

    } catch (error) {
        // console.log(error);
        res.status(500).json({ message: "Error fetching data", error });
    }
});


router.get('/region/renderRegionDetail/:id', isAdmin, async (req, res) => {
    const id = req.params.id;
    try {
        const [rows] = await db.query(`
            SELECT region.*, metadata.meta_title, metadata.meta_description, metadata.canonical_url
            FROM region
            LEFT JOIN metadata ON metadata.module = 'region' AND metadata.module_id = region.id
            WHERE region.id = ?
        `, [id]);

        const [featuredPackages] = await db.query(
            `SELECT 
      lfp.package_id AS id, 
      lfp.order_number, 
      p.title AS text, 
      p.image AS img
   FROM location_featured_packages lfp
   JOIN package p ON lfp.package_id = p.id
   WHERE lfp.module_name = 'region' AND lfp.module_id = ?
   ORDER BY lfp.order_number ASC`,
            [id]
        );
        // console.log("metadata table data => ", rows);
        if (rows.length === 0) {
            return res.status(404).send({ message: "Region not found" });
        }

        res.render('admin/region/details', {
            region: rows[0],
            featuredPackages: featuredPackages,
        });
    } catch (err) {
        // console.log(err);
        res.status(500).json({ message: "Error fetching data", error: err });
    }
});



// state routes

router.get('/state/renderAddPage', isAdmin, async (req, res) => {
    const [regions] = await db.query('SELECT * FROM region');
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'state');
    const allImages = await getAllImages(uploadsDir);
    res.render('admin/state/add', {
        breadcrumbs: [
            { label: 'Dashboard', url: '/admin/dashboard' },
            { label: 'States', url: '/admin/state/state' },
            { label: 'Add State' }
        ],
        regions: regions,
        images: allImages
    });

})

router.get('/state/renderStateDetail/:id', isAdmin, async (req, res) => {
    const id = req.params.id;

    try {
        const [rows] = await db.query(
            `SELECT 
                state.*, 
                region.name AS region_name,
                metadata.meta_title,
                metadata.meta_description,
                metadata.canonical_url
             FROM state 
             LEFT JOIN region ON state.region_id = region.id 
             LEFT JOIN metadata ON metadata.module = 'state' AND metadata.module_id = state.id
             WHERE state.id = ?`,
            [id]);

        const [featuredPackages] = await db.query(
            `SELECT 
      lfp.package_id AS id, 
      lfp.order_number, 
      p.title AS text, 
      p.image AS img
   FROM location_featured_packages lfp
   JOIN package p ON lfp.package_id = p.id
   WHERE lfp.module_name = 'state' AND lfp.module_id = ?
   ORDER BY lfp.order_number ASC`,
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).send({ message: "State not found" });
        }

        res.render('admin/state/show', {
            state: rows[0],
            featuredPackages: featuredPackages,
        });
    } catch (err) {
        // console.log(err);
        res.status(500).json({ message: "Error fetching data", err });
    }
});


router.get('/state/state', isAdmin, async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT s.*, r.name AS region_name
            FROM state s
            JOIN region r ON s.region_id = r.id
        `);
        res.render('admin/state/state', { states: rows });
    } catch (err) {
        // console.log(err);
        res.status(500).json({ message: "Error fetching data", error: err });
    }
});

router.get('/state/renderEditPage/:id', isAdmin, async (req, res) => {
    const id = req.params.id;

    try {
        const [rows] = await db.query(
            `SELECT 
                state.*, 
                region.name AS region_name,
                metadata.meta_title,
                metadata.meta_description,
                metadata.canonical_url
             FROM state
             LEFT JOIN region ON state.region_id = region.id
             LEFT JOIN metadata ON metadata.module = 'state' AND metadata.module_id = state.id
             WHERE state.id = ?`,
            [id]);

        const [featuredPackages] = await db.query(
            `SELECT 
      lfp.package_id AS id, 
      lfp.order_number, 
      p.title AS text, 
      p.image AS img
   FROM location_featured_packages lfp
   JOIN package p ON lfp.package_id = p.id
   WHERE lfp.module_name = 'state' AND lfp.module_id = ?
   ORDER BY lfp.order_number ASC`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).send({ message: "State not found" });
        }

        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'state');
        const allImages = await getAllImages(uploadsDir);

        res.render('admin/state/edit', {
            state: rows[0],
            images: allImages,
            selectedFeaturedPackages: JSON.stringify(featuredPackages)
        });
    } catch (err) {
        // console.log(err);
        res.status(500).json({ message: "Error fetching data", error: err });
    }
});


router.get('/city/renderAddPage', isAdmin, async (req, res) => {
    const [states] = await db.query('SELECT * FROM state');
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'city');
    const allImages = await getAllImages(uploadsDir);
    // console.log(states);
    res.render('admin/city/add', {
        breadcrumbs: [
            { label: 'Dashboard', url: '/admin/dashboard' },
            { label: 'city', url: '/admin/city/city' },
            { label: 'Add city' }
        ],
        states: states,
        images: allImages
    });

})


router.get('/city/rendercityDetail/:id', isAdmin, async (req, res) => {
    const id = req.params.id;

    try {
        const [rows] = await db.query(
            `SELECT 
                city.*, 
                state.name AS state_name,
                metadata.meta_title,
                metadata.meta_description,
                metadata.canonical_url
             FROM city 
             LEFT JOIN state ON city.state_id = state.id 
             LEFT JOIN metadata ON metadata.module = 'city' AND metadata.module_id = city.id
             WHERE city.id = ?`,
            [id]);

        const [featuredPackages] = await db.query(
            `SELECT 
      lfp.package_id AS id, 
      lfp.order_number, 
      p.title AS text, 
      p.image AS img
   FROM location_featured_packages lfp
   JOIN package p ON lfp.package_id = p.id
   WHERE lfp.module_name = 'city' AND lfp.module_id = ?
   ORDER BY lfp.order_number ASC`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).send({ message: "City not found" });
        }

        res.render('admin/city/show', {
            city: rows[0],
            featuredPackages: featuredPackages,
        });
    } catch (err) {
        // console.log(err);
        res.status(500).json({ message: "Error fetching data", error: err });
    }
});

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
    SELECT 
        c.*, 
        s.name AS state_name,
        m.meta_title,
        m.meta_description,
        m.canonical_url
    FROM city c
    LEFT JOIN state s ON c.state_id = s.id
    LEFT JOIN metadata m ON m.module = 'city' AND m.module_id = c.id
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
        res.status(500).json({ message: "Error fetching data", error: err });
    }
});

router.get('/city/renderEditPage/:id', isAdmin, async (req, res) => {
    const id = req.params.id;

    try {
        const [rows] = await db.query(
            `SELECT 
                city.*, 
                state.name AS state_name,
                metadata.meta_title,
                metadata.meta_description,
                metadata.canonical_url
             FROM city
             LEFT JOIN state ON city.state_id = state.id
             LEFT JOIN metadata ON metadata.module = 'city' AND metadata.module_id = city.id
             WHERE city.id = ?`,
            [id]);

        const [featuredPackages] = await db.query(
            `SELECT 
      lfp.package_id AS id, 
      lfp.order_number, 
      p.title AS text, 
      p.image AS img
   FROM location_featured_packages lfp
   JOIN package p ON lfp.package_id = p.id
   WHERE lfp.module_name = 'city' AND lfp.module_id = ?
   ORDER BY lfp.order_number ASC`,
            [id]
        );


        if (rows.length === 0) {
            return res.status(404).send({ message: "city not found" });
        }

        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'city');
        const allImages = await getAllImages(uploadsDir);

        console.log("Featured Packages: ", featuredPackages);
        res.render('admin/city/edit', {
            city: rows[0],
            images: allImages,
            content: JSON.stringify(rows[0].content) || '',
            selectedFeaturedPackages: JSON.stringify(featuredPackages)
        });
    } catch (err) {
        res.status(500).json({ message: "Error fetching data", error: err });
    }
});


export default router;