import express from 'express';
import db from '../../db.js'; // Adjust the path as necessary
import isAdmin from '../../middleware/adminMiddleware.js';

const router = express.Router();

router.get('/package/package', isAdmin, async (req, res) => {
    try {
        const [packages] = await db.query(`
            SELECT 
                package.*, 
                slug.title AS slug_title
            FROM package
            JOIN slug ON package.slug = slug.id
        `);

        console.log(packages, 'packages');
        res.render('admin/package/package', { packages });
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

router.get('/package/renderEditPage/:id', isAdmin, async (req, res) => {
    const id = req.params.id;

    try {
        // 1. Get the package by ID
        const [packageRows] = await db.query(`SELECT * FROM package WHERE id = ?`, [id]);
        if (packageRows.length === 0) {
            return res.status(404).send({ message: "package not found" });
        }

        // 2. Get all slugs
        const [slugs] = await db.query(`SELECT * FROM slug`);

        // 3. Render the edit page with both package and slugs
        res.render('admin/package/edit', {
            package: packageRows[0],
            slugs
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Error fetching data" });
    }
});


router.get('/package/renderAddPage', isAdmin, async (req, res) => {
    try {
        const [themes] = await db.query(`
            SELECT 
                theme.*, 
                slug.title AS slug_title
            FROM theme
            JOIN slug ON theme.slug = slug.id
        `);
        console.log(themes, 'themes');
        res.render('admin/package/add', {
            breadcrumbs: [
                { label: 'Dashboard', url: '/admin/dashboard' },
                { label: 'packages', url: '/admin/package/package' },
                { label: 'Add package' }
            ],
            themes
        });
    } catch (error) {
        console.error('Error rendering add page:', error);
        res.status(500).send({ message: 'Internal server error' });
    }
});


// slug
router.get('/package/renderpackageDetail/:id', isAdmin, async (req, res) => {
    const id = req.params.id;

    try {
        const [rows] = await db.query(`
            SELECT 
                package.*, 
                slug.title AS slug_title
            FROM package
            JOIN slug ON package.slug = slug.id
            WHERE package.id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).send({ message: "package not found" });
        }
        // console.log(rows)
        res.render('admin/package/show', { package: rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Error fetching data" });
    }
});

export default router;