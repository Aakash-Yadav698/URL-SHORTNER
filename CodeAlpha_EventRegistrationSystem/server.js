require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const sequelize = require('./config/db');
require('./models/Event');
require('./models/Registration'); // sets up the Event <-> Registration association

const eventRoutes = require('./routes/eventRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const { login } = require('./middleware/auth');

const PORT = process.env.PORT || 8081;

async function ensureMysqlDatabase() {
  const mysql = require('mysql2/promise');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  });
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'event_registration_db'}\``);
  await connection.end();
}

async function start() {
  try {
    if ((process.env.DB_DIALECT || 'sqlite').toLowerCase() === 'mysql') {
      await ensureMysqlDatabase();
    }
    await sequelize.authenticate();
    await sequelize.sync();

    const app = express();
    app.use(cors());
    app.use(express.json());

    app.post('/api/auth/login', login);
    app.use('/api/events', eventRoutes);
    app.use('/api/registrations', registrationRoutes);

    // Frontend
    app.use(express.static(path.join(__dirname, 'public')));

    app.listen(PORT, () => {
      console.log(`Event Registration System running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
