require('dotenv').config();
const path = require('path');
const { Sequelize } = require('sequelize');

const dialect = (process.env.DB_DIALECT || 'sqlite').toLowerCase();

let sequelize;
if (dialect === 'mysql') {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'event_registration_db',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: false
    }
  );
} else {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', 'data', 'events.sqlite'),
    logging: false
  });
}

module.exports = sequelize;
