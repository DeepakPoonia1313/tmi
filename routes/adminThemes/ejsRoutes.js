import express from 'express';
import db from '../../db.js'; // Adjust the path as necessary
import isAdmin from '../../middleware/adminMiddleware.js';
import { getAllImages } from '../adminDestRoutes/ejsRoutes.js';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();

// router.get('/theme/theme', isAdmin, async (req, res) => {
//     try {
//         const [themes] = await db.query('SELECT * FROM theme');
//         console.log(themes, 'themes');
//         res.render('admin/theme/theme', { themes });
//     } catch (error) {
//         console.log(error);
//         res.status(500).send({ message: "Internal Server Error" });
//     }
// })
router.get('/theme/theme', isAdmin, async (req, res) => {
    try {
        const [themes] = await db.query(`
            SELECT * FROM theme
        `);

        console.log(themes, 'themes');
        res.render('admin/theme/theme', { themes });
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});


// router.get('/theme/renderEditPage/:id', isAdmin, async (req, res) => {
//     const id = req.params.id;
//     // const id = 1;
//     try {
//         const [rows] = await db.query(`SELECT * FROM theme WHERE id = ?`, [id]);
//         if (rows.length === 0) {
//             return res.status(404).send({ message: "theme not found" });
//         }
//         res.render('admin/theme/edit', { theme: rows[0] });
//     } catch (err) {
//         console.log(err);
//         res.status(500).send({ message: "Error fetching data" });
//     }
//     // res.render('admin/theme/edit', { theme: result.rows[0] });
// })
router.get('/theme/renderEditPage/:id', isAdmin, async (req, res) => {
    const id = req.params.id;

    try {
        // 1. Get the theme by ID
        const [themeRows] = await db.query(`SELECT * FROM theme WHERE id = ?`, [id]);
        if (themeRows.length === 0) {
            return res.status(404).send({ message: "Theme not found" });
        }


        // 3. Render the edit page with both theme
        res.render('admin/theme/edit', {
            theme: themeRows[0],
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Error fetching data" });
    }
});


router.get('/theme/renderAddPage', isAdmin, async (req, res) => {
    try {
        res.render('admin/theme/add', {
            breadcrumbs: [
                { label: 'Dashboard', url: '/admin/dashboard' },
                { label: 'themes', url: '/admin/theme/theme' },
                { label: 'Add theme' }
            ],
        });
    } catch (error) {
        console.error('Error rendering add page:', error);
        res.status(500).send({ message: 'Internal server error' });
    }
});

// router.get('/theme/renderthemeDetail/:id', isAdmin, async (req, res) => {
//     const id = req.params.id;
//     // const id = 1;
//     try {
//         const [rows] = await db.query(`SELECT * FROM theme WHERE id = ?`, [id]);
//         if (rows.length === 0) {
//             return res.status(404).send({ message: "theme not found" });
//         }
//         res.render('admin/theme/show', { theme: rows[0] });
//     } catch (err) {
//         console.log(err);
//         res.status(500).send({ message: "Error fetching data" });
//     }
// })


router.get('/theme/renderthemeDetail/:id', isAdmin, async (req, res) => {
    const id = req.params.id;

    try {
        const [rows] = await db.query(`
            SELECT * FROM theme
            where id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).send({ message: "Theme not found" });
        }
        // console.log(rows)
        res.render('admin/theme/show', { theme: rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Error fetching data" });
    }
});


// // interest
// router.get('/interest/interest', isAdmin, async (req, res) => {
//     try {
//         const [interests] = await db.query('SELECT * FROM interest');
//         console.log(interests, 'interests');
//         res.render('admin/interest/interest', { interests });
//     } catch (error) {
//         console.log(error);
//         res.status(500).send({ message: "Internal Server Error" });
//     }
// })

// router.get('/interest/renderEditPage/:id', isAdmin, async (req, res) => {
//     const id = req.params.id;
//     // const id = 1;
//     try {
//         const [rows] = await db.query(`SELECT * FROM interest WHERE id = ?`, [id]);
//         if (rows.length === 0) {
//             return res.status(404).send({ message: "interest not found" });
//         }
//         res.render('admin/interest/edit', { interest: rows[0] });
//     } catch (err) {
//         console.log(err);
//         res.status(500).send({ message: "Error fetching data" });
//     }
//     // res.render('admin/interest/edit', { interest: result.rows[0] });
// })

// router.get('/interest/renderAddPage', isAdmin, (req, res) => {
//     res.render('admin/interest/add', {
//         breadcrumbs: [
//             { label: 'Dashboard', url: '/admin/dashboard' },
//             { label: 'interests', url: '/admin/interest/interest' },
//             { label: 'Add interest' }
//         ]
//     });
// });

// // router.get('/interest/renderinterestDetail/:id', isAdmin, async (req, res) => {
// //     const id = req.params.id;
// //     // const id = 1;
// //     try {
// //         const [rows] = await db.query(`SELECT * FROM interest WHERE id = ?`, [id]);
// //         if (rows.length === 0) {
// //             return res.status(404).send({ message: "interest not found" });
// //         }
// //         res.render('admin/interest/show', { interest: rows[0] });
// //     } catch (err) {
// //         console.log(err);
// //         res.status(500).send({ message: "Error fetching data" });
// //     }
// // })
// router.get('/interest/renderinterestDetail/:id', isAdmin, async (req, res) => {
//     const id = req.params.id;

//     try {
//         const [rows] = await db.query(`
//             SELECT 
//                 interest.*, 
//                 slug.title AS slug_title
//             FROM interest
//             JOIN slug ON interest.slug = slug.id
//             WHERE interest.id = ?
//         `, [id]);

//         if (rows.length === 0) {
//             return res.status(404).send({ message: "interest not found" });
//         }
//         // console.log(rows)
//         res.render('admin/interest/show', { interest: rows[0] });
//     } catch (err) {
//         console.error(err);
//         res.status(500).send({ message: "Error fetching data" });
//     }
// });


export default router;