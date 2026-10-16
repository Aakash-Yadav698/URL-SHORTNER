const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Event = require('./Event');

const Registration = sequelize.define('Registration', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userEmail: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { isEmail: true }
  },
  status: {
    type: DataTypes.ENUM('CONFIRMED', 'CANCELLED'),
    allowNull: false,
    defaultValue: 'CONFIRMED'
  }
}, {
  tableName: 'registrations',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['EventId', 'userEmail'] }
  ]
});

// A Registration belongs to one Event; an Event has many Registrations
Event.hasMany(Registration, { onDelete: 'CASCADE' });
Registration.belongsTo(Event);

module.exports = Registration;
