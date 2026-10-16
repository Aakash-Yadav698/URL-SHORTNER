const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING(2000),
    allowNull: true
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  eventDateTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1 }
  }
}, {
  tableName: 'events',
  timestamps: true
});

module.exports = Event;
