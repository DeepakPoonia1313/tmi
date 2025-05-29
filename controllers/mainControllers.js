import db, { createDatabaseIfNotExists } from '../db.js';

export const createDbAndTables = async () => {
    try {
        console.log('🔧 Creating/updating database and tables...');
        await createDatabaseIfNotExists();

        console.log({ message: 'Database and tables created/updated successfully.' });
    } catch (error) {
        console.error('❌ Error creating/updating tables:', error);
        console.log({ error: 'Failed to create or update tables.' });
    }
};