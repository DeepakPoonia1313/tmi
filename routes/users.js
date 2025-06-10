// routes/users.js
// const express = require('express');
// const router = express.Router();
// const db = require('../db');
import express from 'express';
import db from '../db.js'; // Adjust the path as necessary
const router = express.Router();

// Route to create a 'users' table
router.get('/create-table', async (req, res) => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100) UNIQUE,
        age INT
      )
    `);
    res.send('✅ Users table created successfully.');
  } catch (err) {
    console.error(err);
    res.status(500).json('❌ Error creating users table.');
  }
});

// Route to insert a new user
router.post('/add', async (req, res) => {
  const { name, email, age } = req.body;

  try {
    const [result] = await db.query(
      'INSERT INTO users (name, email, age) VALUES (?, ?, ?)',
      [name, email, age]
    );
    // console.log(result);
    res.json({
      message: '✅ User added successfully.',
      userId: result.insertId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json(err.sqlMessage);
  }
});

// Route to fetch all users
router.get('/all', async (req, res) => {
  try {
    const [users] = await db.query('SELECT * FROM users');
    const [tables] = await db.query('SHOW TABLES');
    res.json({ users, tables });
  } catch (err) {
    console.error(err);
    res.status(500).json('❌ Error fetching users.');
  }
});

export default router;