// import fs from 'fs';
// import pool from '../db.js'; // Reuse your db.js file
// import { fileURLToPath } from 'url';
// import path from 'path';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const citiesFilePath = path.join(__dirname, 'cities.json');
// const citiesData = JSON.parse(fs.readFileSync(citiesFilePath, 'utf8'));

// const seedStatesAndCities = async () => {
//     const stateMap = new Map();

//     for (const entry of citiesData) {
//         const stateName = entry.state.trim();
//         const cityName = entry.city.trim();

//         if (stateName.length > 100) {
//             console.warn(`⚠️ State name too long (${stateName.length}): ${stateName}`);
//         }
//         if (cityName.length > 100) {
//             console.warn(`⚠️ City name too long (${cityName.length}): ${cityName}`);
//         }

//         let stateId;

//         // Check if state is already cached
//         if (stateMap.has(stateName)) {
//             stateId = stateMap.get(stateName);
//         } else {
//             // Check if state exists in DB
//             const [stateRows] = await pool.execute(
//                 'SELECT id FROM state WHERE name = ?',
//                 [stateName]
//             );

//             if (stateRows.length > 0) {
//                 stateId = stateRows[0].id;
//             } else {
//                 // Insert new state
//                 const [insertState] = await pool.execute(
//                     `INSERT INTO state (name, description, content, image, region_id, meta_title, meta_description)
//            VALUES (?, '1', '1', '1', 1, ?, ?)`,
//                     [stateName, stateName, stateName]
//                 );
//                 stateId = insertState.insertId;
//             }

//             stateMap.set(stateName, stateId);
//         }

//         // Insert city linked to the state
//         await pool.execute(
//             `INSERT INTO city (name, description, content, image, state_id, meta_title, meta_description)
//        VALUES (?, '1', '1', '1', ?, ?, ?)`,
//             [cityName, stateId, cityName, cityName]
//         );
//     }

//     // console.log('✅ States and cities seeded successfully.');
// };

// seedStatesAndCities()
//     .then(() => process.exit())
//     .catch((err) => {
//         console.error('❌ Error seeding states and cities:', err);
//         process.exit(1);
//     });


import fs from 'fs';
import pool from '../db.js'; // Your mysql2 pool connection
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const citiesFilePath = path.join(__dirname, 'cities.json');
const citiesData = JSON.parse(fs.readFileSync(citiesFilePath, 'utf8'));

const seedStatesAndCities = async () => {
    const stateMap = new Map();

    for (const entry of citiesData) {
        const stateName = entry.state.trim();
        const cityName = entry.city.trim();

        if (stateName.length > 100) {
            console.warn(`⚠️ State name too long (${stateName.length}): ${stateName}`);
        }
        if (cityName.length > 100) {
            console.warn(`⚠️ City name too long (${cityName.length}): ${cityName}`);
        }

        let stateId;

        if (stateMap.has(stateName)) {
            stateId = stateMap.get(stateName);
        } else {
            // Check if state exists
            const [stateRows] = await pool.execute(
                'SELECT id FROM state WHERE name = ? COLLATE utf8mb4_general_ci',
                [stateName]
            );

            if (stateRows.length > 0) {
                stateId = stateRows[0].id;
            } else {
                // Insert new state with meaningful placeholders or empty strings instead of '1'
                const [insertState] = await pool.execute(
                    `INSERT INTO state (name, description, content, image, region_id, meta_title, meta_description)
           VALUES (?, '', '', '', 1, ?, ?)`,
                    [stateName, stateName, stateName]
                );
                stateId = insertState.insertId;
            }
            stateMap.set(stateName, stateId);
        }

        // Insert city linked to state
        await pool.execute(
            `INSERT INTO city (name, description, content, image, state_id, meta_title, meta_description)
       VALUES (?, '', '', '', ?, ?, ?)`,
            [cityName, stateId, cityName, cityName]
        );
    }

    // console.log('✅ States and cities seeded successfully.');
};

seedStatesAndCities()
    .then(() => process.exit())
    .catch((err) => {
        console.error('❌ Error seeding states and cities:', err);
        process.exit(1);
    });
