const express = require('express');
const router = express.Router();
const { register, getByUser, getByEvent, cancelRegistration } = require('../controllers/registrationController');
const { requireOrganizer } = require('../middleware/auth');

router.post('/', register);
router.get('/user/:email', getByUser);
router.get('/event/:eventId', requireOrganizer, getByEvent);
router.put('/:id/cancel', cancelRegistration);

module.exports = router;
