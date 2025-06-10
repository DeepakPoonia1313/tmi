import express from 'express';
import bcrypt from 'bcrypt';
import db from '../../db.js'; // Adjust the path as necessary
import isAdmin from '../../middleware/adminMiddleware.js';
import createDynamicMulterMiddleware from '../../utils/multerDestinaProps.js';
import path from 'path';
import fs from 'fs';
import { removeDataMceSrc } from '../adminDestRoutes/destControllerRoutes.js';

const router = express.Router();

router.post('/itinerary/add', isAdmin, async (req, res) => {
    try {
        const { package_id, itineraries } = req.body;

        console.log("Received data:", req.body); // Debug log

        if (!package_id || !Array.isArray(itineraries)) {
            return res.status(400).json({
                error: 'Package ID and itinerary list are required.',
                received: req.body // Include received data for debugging
            });
        }

        // Validate each itinerary item
        const validItineraries = itineraries.filter(item =>
            item.day_number && item.content
        );

        if (validItineraries.length === 0) {
            return res.status(400).json({ error: 'No valid itinerary items provided.' });
        }

        // Process each itinerary item
        for (const item of validItineraries) {
            const {
                day_number,
                location_from = null,
                location_to = null,
                hotel_id = null,
                distance = 0,
                duration = 0,
                content = '',
                theme_id = null,
            } = item;

            const cleanContent = removeDataMceSrc(content);

            await db.query(`
                INSERT INTO package_itinerary (
                    package_id,
                    day_number,
                    location_from,
                    location_to,
                    hotel_id,
                    distance,
                    duration,
                    content,
                    theme_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                package_id,
                day_number,
                location_from,
                location_to,
                hotel_id,
                distance,
                duration,
                cleanContent,
                theme_id
            ]);
        }

        return res.status(200).json({ message: 'Itineraries added successfully.' });
    } catch (error) {
        console.error('Error inserting itineraries:', error);
        return res.status(500).json({
            error: 'An error occurred while adding itineraries.',
            details: error.message
        });
    }
});

// router.post('/itinerary/edit', isAdmin, async (req, res) => {
//     try {
//         const { package_id, itineraries } = req.body;

//         console.log("Received data for editing:", req.body);

//         if (!package_id || !Array.isArray(itineraries)) {
//             return res.status(400).json({
//                 error: 'Package ID and itinerary list are required.',
//                 received: req.body
//             });
//         }

//         // Validate itineraries with valid id and day_number
//         const validItineraries = itineraries.filter(item =>
//             item.id && item.day_number && item.content
//         );

//         if (validItineraries.length === 0) {
//             return res.status(400).json({ error: 'No valid itinerary items with IDs provided.' });
//         }

//         for (const item of validItineraries) {
//             const {
//                 id,
//                 day_number,
//                 location_from = null,
//                 location_to = null,
//                 hotel_id = null,
//                 distance = 0,
//                 duration = 0,
//                 content = '',
//                 theme_id = null
//             } = item;

//             const cleanContent = removeDataMceSrc(content);

//             await db.query(`
//                 UPDATE package_itinerary
//                 SET 
//                     day_number = ?,
//                     location_from = ?,
//                     location_to = ?,
//                     hotel_id = ?,
//                     distance = ?,
//                     duration = ?,
//                     content = ?,
//                     theme_id = ?
//                 WHERE id = ? AND package_id = ?
//             `, [
//                 day_number,
//                 location_from,
//                 location_to,
//                 hotel_id,
//                 distance,
//                 duration,
//                 cleanContent,
//                 theme_id,
//                 id,
//                 package_id
//             ]);
//         }

//         return res.status(200).json({ message: 'Itineraries updated successfully.' });

//     } catch (error) {
//         console.error('Error updating itineraries:', error);
//         return res.status(500).json({
//             error: 'An error occurred while updating itineraries.',
//             details: error.message
//         });
//     }
// });

router.post('/itinerary/edit', isAdmin, async (req, res) => {
    try {
        const { package_id, itineraries } = req.body;

        console.log("Received data for editing:", req.body);

        if (!package_id || !Array.isArray(itineraries)) {
            return res.status(400).json({
                error: 'Package ID and itinerary list are required.',
                received: req.body
            });
        }

        const toUpdate = itineraries.filter(item => item.id && item.day_number && item.content);
        const toInsert = itineraries.filter(item => !item.id && item.day_number && item.content);

        // Update existing itineraries
        for (const item of toUpdate) {
            const {
                id,
                day_number,
                location_from = null,
                location_to = null,
                hotel_id = null,
                distance = 0,
                duration = 0,
                content = '',
                theme_id = null
            } = item;

            const cleanContent = removeDataMceSrc(content);

            await db.query(`
                UPDATE package_itinerary
                SET 
                    day_number = ?,
                    location_from = ?,
                    location_to = ?,
                    hotel_id = ?,
                    distance = ?,
                    duration = ?,
                    content = ?,
                    theme_id = ?
                WHERE id = ? AND package_id = ?
            `, [
                day_number,
                location_from,
                location_to,
                hotel_id,
                distance,
                duration,
                cleanContent,
                theme_id,
                id,
                package_id
            ]);
        }

        // Insert new itineraries
        for (const item of toInsert) {
            const {
                day_number,
                location_from = null,
                location_to = null,
                hotel_id = null,
                distance = 0,
                duration = 0,
                content = '',
                theme_id = null,
            } = item;

            const cleanContent = removeDataMceSrc(content);

            await db.query(`
                INSERT INTO package_itinerary (
                    package_id,
                    day_number,
                    location_from,
                    location_to,
                    hotel_id,
                    distance,
                    duration,
                    content,
                    theme_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                package_id,
                day_number,
                location_from,
                location_to,
                hotel_id,
                distance,
                duration,
                cleanContent,
                theme_id
            ]);
        }

        return res.status(200).json({
            message: `Itineraries updated: ${toUpdate.length}, inserted: ${toInsert.length}.`
        });

    } catch (error) {
        console.error('Error updating/inserting itineraries:', error);
        return res.status(500).json({
            error: 'An error occurred while processing itineraries.',
            details: error.message
        });
    }
});


router.post('/itinerary/delete/:packageId/:itineraryId', isAdmin, async (req, res) => {
    try {
        const { packageId, itineraryId } = req.params;

        if (!packageId || !itineraryId) {
            return res.status(400).json({ error: 'Package ID and itinerary ID are required.' });
        }
        // Delete the itinerary
        await db.query(`
            DELETE FROM package_itinerary 
            WHERE id = ? AND package_id = ?
        `, [itineraryId, packageId]);
        return res.status(200).json({ message: 'Itinerary deleted successfully.' });
    } catch (error) {
        console.error('Error deleting itineraries:', error);
        return res.status(500).json({
            error: 'An error occurred while deleting itineraries.',
            details: error.message
        });
    }
});

// router.get('/package/:package_id', isAdmin, async (req, res) => {
//     const { package_id } = req.params;
//     const [packageDetails] = await db.query(`
//         SELECT * FROM package WHERE id = ?
//     `, [package_id]);

//     res.render(`admin/package/${packageDetails.template || 'package'}`, {
//         package: packageDetails[0] || {},
//         package_id
//     });
// })


export default router;