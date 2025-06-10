import express from 'express';
import db from '../../db.js'; // Adjust the path as necessary
import isAdmin from '../../middleware/adminMiddleware.js';
import { getAllImages } from '../adminDestRoutes/ejsRoutes.js';
import path from 'path';

const router = express.Router();

router.get('/api/packages', async (req, res) => {
    const search = req.query.q || '';
    try {
        const [rows] = await db.query(
            'SELECT id, title, image FROM package WHERE title LIKE ? LIMIT 20',
            [`%${search}%`]
        );
        const results = rows.map(pkg => ({
            id: pkg.id,
            text: pkg.title,
            img: pkg.image
        }));
        res.json({ results });
    } catch (error) {
        console.error('Error fetching cities:', error);
        res.status(500).json({ message: error.sqlMessage, error: error });
    }
});

router.get('/package/package', isAdmin, async (req, res) => {
    try {
        const search = req.query.search || '';
        const currentPage = parseInt(req.query.page) || 1;
        const perPage = 10;
        const offset = (currentPage - 1) * perPage;

        const searchQuery = search ? `%${search}%` : '%';

        // Query for filtered packages
        const [packages] = await db.query(
            `SELECT * FROM package WHERE title LIKE ? LIMIT ? OFFSET ?`,
            [searchQuery, perPage, offset]
        );

        // Query for total count
        const [[{ total }]] = await db.query(
            `SELECT COUNT(*) as total FROM package WHERE title LIKE ?`,
            [searchQuery]
        );

        const totalPages = Math.ceil(total / perPage);

        // If it's an AJAX request, return JSON
        if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
            return res.json({
                packages,
                total,
                totalPages,
                currentPage,
                search
            });
        }

        // Otherwise, render the EJS page
        res.render('admin/package/package', {
            packages,
            total,
            totalPages,
            currentPage,
            search
        });

    } catch (error) {
        console.error('Error fetching packages:', error);
        res.status(500).json({ message: error.sqlMessage, error });
    }
});

router.get('/package/renderEditPage/:id', isAdmin, async (req, res) => {
    const id = req.params.id;

    try {
        // 1. Get the package by ID including metadata if available
        const [packageRows] = await db.query(`
            SELECT 
                p.*, 
                m.meta_title, 
                m.meta_description, 
                m.canonical_url
            FROM package p
            LEFT JOIN metadata m ON m.module = 'package' AND m.module_id = p.id
            WHERE p.id = ?
        `, [id]);

        if (packageRows.length === 0) {
            return res.status(404).send({ message: "Package not found" });
        }

        const packageData = packageRows[0];

        // 2. Get all package images
        const [packageImages] = await db.query(
            `SELECT * FROM package_images WHERE package_id = ?`,
            [id]
        );

        // --- START: Fetch Themes for Edit Page ---
        // 3. Get all available themes (for the datalist options)
        const [allThemes] = await db.query('SELECT id, name FROM theme');

        // 4. Get themes specifically associated with THIS package
        const [selectedThemes] = await db.query(
            `SELECT theme_id AS id, theme_name AS name FROM package_themes WHERE package_id = ?`,
            [id]
        );
        // --- END: Fetch Themes for Edit Page ---

        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'package');
        const allImages = await getAllImages(uploadsDir);

        // 4. Render the edit page
        res.render('admin/package/edit', {
            breadcrumbs: [
                { label: 'Dashboard', url: '/admin/dashboard' },
                { label: 'Packages', url: '/admin/package/package' },
                { label: 'Edit Package' }
            ],
            package: packageData,
            packageImages,
            themes: allThemes, // Pass all available themes for the dropdown
            selectedThemes: selectedThemes, // Pass the themes currently selected for this package
            images: allImages
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.sqlMessage, error: err });
    }
});

router.get('/package/renderAddPage', isAdmin, async (req, res) => {
    try {
        const [themes] = await db.query(`
            SELECT * FROM theme
        `);
        // console.log(themes, 'themes');
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'package');
        const allImages = await getAllImages(uploadsDir);
        res.render('admin/package/add', {
            breadcrumbs: [
                { label: 'Dashboard', url: '/admin/dashboard' },
                { label: 'packages', url: '/admin/package/package' },
                { label: 'Add package' }
            ],
            themes,
            images: allImages
        });
    } catch (error) {
        console.error('Error rendering add page:', error);
        res.status(500).json({ message: error.sqlMessage, error });
    }
});

router.get('/package/renderpackageDetail/:id', isAdmin, async (req, res) => {
    const id = req.params.id;

    try {
        // 1. Get package and metadata
        const [rows] = await db.query(`
            SELECT 
                p.*, 
                m.meta_title, 
                m.meta_description, 
                m.canonical_url
            FROM package p
            LEFT JOIN metadata m ON m.module = 'package' AND m.module_id = p.id
            WHERE p.id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).send({ message: "Package not found" });
        }

        const packageData = rows[0];

        // 2. Get package images
        const [packageImages] = await db.query(
            `SELECT * FROM package_images WHERE package_id = ?`,
            [id]
        );

        // --- START: Fetch Themes for Detail Page ---
        // 3. Get themes specifically associated with THIS package
        const [associatedThemes] = await db.query(
            `SELECT theme_id AS id, theme_name AS name FROM package_themes WHERE package_id = ?`,
            [id]
        );
        // --- END: Fetch Themes for Detail Page ---

        // 3. Render the view
        res.render('admin/package/show', {
            package: packageData,
            packageImages,
            associatedThemes: associatedThemes,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.sqlMessage, error: err });
    }
});


export default router;