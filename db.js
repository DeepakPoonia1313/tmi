// db.js
import mysql from 'mysql2/promise';

export const createDatabaseIfNotExists = async () => {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'dbuser',
    password: 'D@T@B@s3',
    port: 3306,
  });

  await connection.query('CREATE DATABASE IF NOT EXISTS TMIDB');
  console.log('✅ Database "TMIDB" ensured.');
  await connection.end();
};

// Export the pool configured for the 'college' database
const pool = mysql.createPool({
  host: '127.0.0.1',
  user: 'dbuser',
  password: 'D@T@B@s3',
  database: 'TMIDB',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true,
});

pool.getConnection()
  .then(connection => {
    console.log('✅ MySQL connection pool established.');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Error connecting to MySQL:', err);
  });

export default pool;
