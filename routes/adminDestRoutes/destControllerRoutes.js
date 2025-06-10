import express from 'express';
import bcrypt from 'bcrypt';
import db from '../../db.js'; // Adjust the path as necessary
import isAdmin from '../../middleware/adminMiddleware.js';
import createDynamicMulterMiddleware from '../../utils/multerDestinaProps.js';
import path from 'path';
import fs from 'fs';

const dynamicImageUpload = createDynamicMulterMiddleware();
export function removeDataMceSrc(html) {
    return html
        // Replace any number of ../ before uploads/, e.g., ../../uploads/... or ../../../uploads/...
        .replace(/<img([^>]*?)src="(?:\.\.\/)+?(uploads\/[^"]+)"([^>]*?)>/g, '<img$1src="/$2"$3>')
        // Remove data-mce-src from <img> tags
        .replace(/<img([^>]*?)\sdata-mce-src="[^"]*"([^>]*?)>/g, '<img$1$2>');
}



const router = express.Router();

router.post('/region/add', isAdmin, dynamicImageUpload.single('image'), async (req, res) => {
    const { name, description, content, image, meta_title, meta_description, canonical_url, slug } = req.body;

    try {
        if (!name || !description || (!image && !req.filePath)) {
            return res.status(400).send('Name, description, and image are required.');
        }

        // Clean content if needed
        const cleanContent = removeDataMceSrc(content);
        // 1. Insert into `region` table
        const [regionResult] = await db.query(`
            INSERT INTO region (name, description, content, image, slug)
            VALUES (?, ?, ?, ?, ?)
        `, [name, description, cleanContent, req.filePath || image, slug]);

        const regionId = regionResult.insertId;

        // 2. Insert metadata
        await db.query(`
            INSERT INTO metadata (module, module_id, meta_title, meta_description, canonical_url)
            VALUES (?, ?, ?, ?, ?)
        `, ['region', regionId, meta_title, meta_description, canonical_url]); // 1 = region module

        const featuredPackages = JSON.parse(req.body.featured_packages);

        for (const pkg of featuredPackages) {
            await db.query(
                'INSERT INTO location_featured_packages (module_name, module_id, package_id, order_number) VALUES (?, ?, ?, ?)',
                ['region', regionId, pkg.package_id, pkg.order_number]
            );
        }

        res.redirect('/admin/region/region');
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.sqlMessage || 'Error saving Data.' });
    }
});

router.post('/region/update', isAdmin, dynamicImageUpload.single('image'), async (req, res) => {
    try {
        const { id, name, description, meta_title, meta_description, canonical_url, content, slug } = req.body;
        const image = req.filePath;

        if (!id) {
            return res.status(400).send({ message: "Missing region ID" });
        }

        const fields = [];
        const values = [];

        if (name !== undefined) {
            fields.push('name = ?');
            values.push(name);
        }
        if (description !== undefined) {
            fields.push('description = ?');
            values.push(description);
        }
        if (image !== undefined) {
            fields.push('image = ?');
            values.push(image);
        }
        if (content !== undefined) {
            fields.push('content = ?');
            const cleanContent = removeDataMceSrc(content);
            values.push(cleanContent);
        }
        if (slug !== undefined) {
            fields.push('slug = ?');
            values.push(slug);
        }

        values.push(id);

        if (fields.length > 0) {
            const updateQuery = `UPDATE region SET ${fields.join(', ')} WHERE id = ?`;
            await db.execute(updateQuery, values);
        }

        // Handle old image deletion if needed
        if (image) {
            const [rows] = await db.query('SELECT image FROM region WHERE id = ?', [id]);
            if (rows.length > 0 && rows[0].image && rows[0].image !== image) {
                const fullOldImagePath = path.join(process.cwd(), 'public', rows[0].image);
                fs.unlink(fullOldImagePath, (err) => {
                    if (err) console.error('Error deleting old image:', err);
                    else console.log('Old image deleted:', fullOldImagePath);
                });
            }
        }

        // Upsert metadata: try update first, then insert if not found
        const [metaRows] = await db.query(`SELECT * FROM metadata WHERE module = ? AND module_id = ?`, ['region', id]);

        if (metaRows.length > 0) {
            await db.query(`
                UPDATE metadata
                SET meta_title = ?, meta_description = ?, canonical_url = ?
                WHERE module = ? AND module_id = ?
            `, [meta_title, meta_description, canonical_url, 'region', id]);
        } else {
            await db.query(`
                INSERT INTO metadata (module, module_id, meta_title, meta_description, canonical_url)
                VALUES (?, ?, ?, ?, ?)
            `, ['region', id, meta_title, meta_description, canonical_url]);
        }

        if (req.body.featured_packages) {
            try {
                const featuredPackages = JSON.parse(req.body.featured_packages);

                // Delete existing featured packages for this city
                await db.query(
                    'DELETE FROM location_featured_packages WHERE module_name = ? AND module_id = ?',
                    ['city', id]
                );

                // Insert new featured packages with order_number
                for (const pkg of featuredPackages) {
                    await db.query(
                        'INSERT INTO location_featured_packages (module_name, module_id, package_id, order_number) VALUES (?, ?, ?, ?)',
                        ['region', id, pkg.package_id, pkg.order_number]
                    );
                }
            } catch (err) {
                console.error('Error updating featured packages:', err);
                return res.status(500).json({ message: 'Error updating featured packages' });
            }
        }

        res.redirect('/admin/region/region');
    } catch (err) {
        console.error('Error updating region:', err);
        res.status(500).json({ message: err.sqlMessage || 'Error saving Data.' });
    }
});

router.get('/region/delete/:id', isAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        // console.log("admin is deleting a region in the dest controller =>", id);
        const [rows] = await db.query('SELECT image FROM region WHERE id = ?', [id]);
        if (rows.length > 0) {
            const fullImagePath = path.join(process.cwd(), 'public', rows[0].image);
            fs.unlink(fullImagePath, (err) => {
                // console.log(err)
            })
        }
        await db.query('DELETE FROM region WHERE id = ?', [id]);
        await db.query('DELETE FROM metadata WHERE module = ? AND module_id = ?', ['region', id]);
        await db.query('DELETE FROM location_featured_packages WHERE module_name = ? AND module_id = ?', ['region', id]);
        // console.log("Region deleted successfully");
        res.json({ success: true, message: 'Region deleted successfully' });
    } catch (error) {
        console.error('Error deleting region:', error);
        res.status(500).json({ message: err.sqlMessage || 'Error saving Data.' });
    }
})

router.post('/state/add', isAdmin, dynamicImageUpload.single('image'), async (req, res) => {
    const { name, description, content, region_id, meta_title, meta_description, canonical_url, slug } = req.body;

    try {
        if (!name || !description || !region_id || (!req.filePath && !req.body.image)) {
            return res.status(400).send('Name, description, region ID, and image are required.');
        }

        const image = req.filePath || req.body.image;

        // Clean content if needed
        const cleanContent = removeDataMceSrc(content);

        const [result] = await db.query(`
            INSERT INTO state (name, description, content, image, region_id, slug)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [name, description, cleanContent, image, region_id, slug]);

        const stateId = result.insertId;

        await db.query(`
            INSERT INTO metadata (module, module_id, meta_title, meta_description, canonical_url)
            VALUES (?, ?, ?, ?, ?)
        `, ['state', stateId, meta_title, meta_description, canonical_url]);

        const featuredPackages = JSON.parse(req.body.featured_packages);

        for (const pkg of featuredPackages) {
            await db.query(
                'INSERT INTO location_featured_packages (module_name, module_id, package_id, order_number) VALUES (?, ?, ?, ?)',
                ['state', stateId, pkg.package_id, pkg.order_number]
            );
        }

        // console.log(result, "<= State added");

        res.redirect('/admin/state/state');
    } catch (err) {
        console.error('Error adding state:', err);
        res.status(500).json({ message: err.sqlMessage || 'Error saving Data.' });
    }
});


router.post('/state/update/:id', isAdmin, dynamicImageUpload.single('image'), async (req, res) => {
    try {
        const id = req.params.id;
        const { name, description, content, region_id, meta_title, meta_description, canonical_url, slug } = req.body;
        const image = req.filePath;

        if (!id) {
            return res.status(400).send({ message: "Missing state ID" });
        }

        const fields = [];
        const values = [];

        if (name !== undefined) {
            fields.push('name = ?');
            values.push(name);
        }
        if (description !== undefined) {
            fields.push('description = ?');
            values.push(description);
        }
        if (content !== undefined) {
            fields.push('content = ?');
            const cleanContent = removeDataMceSrc(content);
            values.push(cleanContent);
        }
        if (image !== undefined) {
            fields.push('image = ?');
            values.push(image);
        }
        if (region_id !== undefined) {
            fields.push('region_id = ?');
            values.push(region_id);
        }
        if (slug !== undefined) {
            fields.push('slug = ?');
            values.push(slug);
        }

        if (fields.length > 0) {
            values.push(id);

            if (image) {
                const [rows] = await db.query('SELECT image FROM state WHERE id = ?', [id]);
                if (rows.length > 0) {
                    const oldImagePath = rows[0].image;
                    const fullOldImagePath = path.join(process.cwd(), 'public', oldImagePath);
                    if (oldImagePath && oldImagePath !== image) {
                        fs.unlink(fullOldImagePath, (err) => {
                            if (err) console.error('Error deleting old image:', err);
                            else console.log('Old image deleted:', fullOldImagePath);
                        });
                    }
                }
            }

            const updateQuery = `UPDATE state SET ${fields.join(', ')} WHERE id = ?`;
            await db.execute(updateQuery, values);
        }

        // Metadata update
        await db.query(`
            INSERT INTO metadata (module, module_id, meta_title, meta_description, canonical_url)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                meta_title = VALUES(meta_title),
                meta_description = VALUES(meta_description),
                canonical_url = VALUES(canonical_url)
        `, ['state', id, meta_title, meta_description, canonical_url]);

        if (req.body.featured_packages) {
            try {
                const featuredPackages = JSON.parse(req.body.featured_packages);

                // Delete existing featured packages for this city
                await db.query(
                    'DELETE FROM location_featured_packages WHERE module_name = ? AND module_id = ?',
                    ['state', id]
                );

                // Insert new featured packages with order_number
                for (const pkg of featuredPackages) {
                    await db.query(
                        'INSERT INTO location_featured_packages (module_name, module_id, package_id, order_number) VALUES (?, ?, ?, ?)',
                        ['state', id, pkg.package_id, pkg.order_number]
                    );
                }
            } catch (err) {
                console.error('Error updating featured packages:', err);
                return res.status(500).json({ message: 'Error updating featured packages' });
            }
        }

        res.redirect('/admin/state/state');
    } catch (err) {
        console.error('Error updating state:', err);
        res.status(500).json({ message: err.sqlMessage || 'Error saving Data.' });
    }
});


router.get('/state/delete/:id', isAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const [rows] = await db.query('SELECT image FROM state WHERE id = ?', [id]);
        if (rows.length > 0) {
            const fullImagePath = path.join(process.cwd(), 'public', rows[0].image);
            fs.unlink(fullImagePath, (err) => {
                // console.log(err)
            });
        }
        await db.query('DELETE FROM state WHERE id = ?', [id]);
        await db.query('DELETE FROM location_featured_packages WHERE module_name = ? AND module_id = ?', ['state', id]);
        await db.query('DELETE FROM metadata WHERE module = ? AND module_id = ?', ['state', id]);
        // console.log("State deleted successfully");
        res.redirect('/admin/state/state');
    } catch (error) {
        console.error('Error deleting state:', error);
        res.status(500).json({ message: err.sqlMessage || 'Error saving Data.' });
    }

})

router.post('/city/add', isAdmin, dynamicImageUpload.single('image'), async (req, res) => {
    const { name, description, content, state_id, meta_title, meta_description, canonical_url, slug } = req.body;

    try {
        if (!name || !description || !state_id || (!req.filePath && !req.body.image)) {
            return res.status(400).send('Name, description, state ID, and image are required.');
        }

        const image = req.filePath || req.body.image;
        // console.log(content, "This is the image path in the city add route");
        const cleanContent = removeDataMceSrc(content);
        // console.log(cleanContent, "This is the cleaned content in the city add route");

        const [result] = await db.query(`
            INSERT INTO city (name, description, content, image, state_id, slug)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [name, description, cleanContent, image, state_id, slug]);

        const cityId = result.insertId;

        await db.query(`
            INSERT INTO metadata (module, module_id, meta_title, meta_description, canonical_url)
            VALUES (?, ?, ?, ?, ?)
        `, ['city', cityId, meta_title, meta_description, canonical_url]);

        const featuredPackages = JSON.parse(req.body.featured_packages);

        for (const pkg of featuredPackages) {
            await db.query(
                'INSERT INTO location_featured_packages (module_name, module_id, package_id, order_number) VALUES (?, ?, ?, ?)',
                ['city', cityId, pkg.package_id, pkg.order_number]
            );
        }

        // console.log(result, "<= city added");
        res.redirect('/admin/city/city');
    } catch (err) {
        console.error('Error adding city:', err);
        res.status(500).json({ message: err.sqlMessage || 'Error saving Data.' });
    }
});


router.post('/city/update/:id', isAdmin, dynamicImageUpload.single('image'), async (req, res) => {
    try {
        const id = req.params.id;
        const { name, description, content, state_id, meta_title, meta_description, canonical_url, slug } = req.body;
        const image = req.filePath;
        // console.log(content, "This is the image path in the city update route");

        if (!id) {
            return res.status(400).send({ message: "Missing city ID" });
        }

        const fields = [];
        const values = [];

        if (name !== undefined) {
            fields.push('name = ?');
            values.push(name);
        }
        if (description !== undefined) {
            fields.push('description = ?');
            values.push(description);
        }
        if (content !== undefined) {
            fields.push('content = ?');
            const cleanContetnt = removeDataMceSrc(content);
            values.push(cleanContetnt);
        }
        if (image !== undefined) {
            fields.push('image = ?');
            values.push(image);
        }
        if (state_id !== undefined) {
            fields.push('state_id = ?');
            values.push(state_id);
        }
        if (slug !== undefined) {
            fields.push('slug = ?');
            values.push(slug);
        }

        if (fields.length > 0) {
            values.push(id);

            // Delete old image if replaced
            let oldImagePath;
            if (image) {
                const [rows] = await db.query('SELECT image FROM city WHERE id = ?', [id]);
                if (rows.length > 0) {
                    oldImagePath = rows[0].image;
                }
            }

            if (image && oldImagePath && oldImagePath !== image) {
                const fullOldImagePath = path.join(process.cwd(), 'public', oldImagePath);
                fs.unlink(fullOldImagePath, (err) => {
                    if (err) console.error('Error deleting old image:', err);
                    else console.log('Old image deleted:', fullOldImagePath);
                });
            }

            const updateQuery = `UPDATE city SET ${fields.join(', ')} WHERE id = ?`;
            await db.execute(updateQuery, values);
        }

        await db.query(`
            INSERT INTO metadata (module, module_id, meta_title, meta_description, canonical_url)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                meta_title = VALUES(meta_title),
                meta_description = VALUES(meta_description),
                canonical_url = VALUES(canonical_url)
        `, ['city', id, meta_title, meta_description, canonical_url]);

        // Update featured packages
        if (req.body.featured_packages) {
            try {
                const featuredPackages = JSON.parse(req.body.featured_packages);

                // Delete existing featured packages for this city
                await db.query(
                    'DELETE FROM location_featured_packages WHERE module_name = ? AND module_id = ?',
                    ['city', id]
                );

                // Insert new featured packages with order_number
                for (const pkg of featuredPackages) {
                    await db.query(
                        'INSERT INTO location_featured_packages (module_name, module_id, package_id, order_number) VALUES (?, ?, ?, ?)',
                        ['city', id, pkg.package_id, pkg.order_number]
                    );
                }
            } catch (err) {
                console.error('Error updating featured packages:', err);
                return res.status(500).json({ message: 'Error updating featured packages' });
            }
        }


        res.redirect('/admin/city/city');
    } catch (err) {
        console.error('Error updating city:', err);
        res.status(500).json({ message: err.sqlMessage || 'Error saving Data.' });
    }
});

router.get('/city/delete/:id', isAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const [city] = await db.query('SELECT * FROM city WHERE id = ?', [id]);
        if (city.length === 0) {
            return res.status(404).send({ message: 'City not found' });
        }
        const imagePath = city[0].image;
        const fullImagePath = path.join(process.cwd(), 'public', imagePath);
        fs.unlink(fullImagePath, (err) => {
            if (err) console.error('Error deleting image:', err);
            else console.log('Image deleted:', fullImagePath);
        });
        await db.query('DELETE FROM metadata WHERE module = ? AND module_id = ?', ['city', id]);
        await db.query('DELETE FROM location_featured_packages WHERE module_name = ? AND module_id = ?', ['city', id]);
        await db.query('DELETE FROM city WHERE id = ?', [id]);
        // console.log("City deleted successfully");
        res.redirect('/admin/city/city');
    }
    catch (err) {
        console.error('Error deleting city:', err);
        res.status(500).json({ message: err.sqlMessage || 'Error saving Data.' });
    }
})

export default router;