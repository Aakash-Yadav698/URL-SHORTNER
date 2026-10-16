const express = require('express');
const router = express.Router();
const { createEvent, getAllEvents, getEventById, deleteEvent } = require('../controllers/eventController');
const { requireOrganizer } = require('../middleware/auth');

router.post('/', requireOrganizer, createEvent);
router.get('/', getAllEvents);
router.get('/:id', getEventById);
router.delete('/:id', requireOrganizer, deleteEvent);

module.exports = router;
