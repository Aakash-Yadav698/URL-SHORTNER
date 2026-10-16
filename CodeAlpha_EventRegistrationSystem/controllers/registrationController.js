const Event = require('../models/Event');
const Registration = require('../models/Registration');

const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

// POST /api/registrations
async function register(req, res) {
  try {
    const { eventId, userName } = req.body;
    const userEmail = (req.body.userEmail || '').trim().toLowerCase();

    if (!eventId || !userName || !userEmail) {
      return res.status(400).json({ error: 'eventId, userName and userEmail are required' });
    }
    if (!emailOk(userEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    const event = await Event.findByPk(eventId);
    if (!event) return res.status(404).json({ error: `Event not found with id: ${eventId}` });

    const existing = await Registration.findOne({ where: { EventId: eventId, userEmail } });
    if (existing && existing.status === 'CONFIRMED') {
      return res.status(409).json({ error: 'This email is already registered for this event.' });
    }

    const confirmedCount = await Registration.count({ where: { EventId: eventId, status: 'CONFIRMED' } });
    if (confirmedCount >= event.capacity) {
      return res.status(409).json({ error: 'Event has reached full capacity.' });
    }

    // Re-registering after a cancellation re-activates the old row
    // (the unique EventId+userEmail index would otherwise reject a new row)
    if (existing) {
      existing.status = 'CONFIRMED';
      existing.userName = userName;
      await existing.save();
      return res.status(201).json(existing);
    }

    const registration = await Registration.create({ EventId: eventId, userName, userEmail, status: 'CONFIRMED' });
    return res.status(201).json(registration);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong while registering' });
  }
}

// GET /api/registrations/user/:email
async function getByUser(req, res) {
  try {
    const registrations = await Registration.findAll({
      where: { userEmail: req.params.email.trim().toLowerCase() },
      include: [{ model: Event }],
      order: [['createdAt', 'DESC']]
    });
    return res.json(registrations);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong while fetching registrations' });
  }
}

// GET /api/registrations/event/:eventId (organizer)
async function getByEvent(req, res) {
  try {
    const registrations = await Registration.findAll({ where: { EventId: req.params.eventId } });
    return res.json(registrations);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong while fetching registrations' });
  }
}

// PUT /api/registrations/:id/cancel  (body: { userEmail } must match the registration owner)
async function cancelRegistration(req, res) {
  try {
    const registration = await Registration.findByPk(req.params.id);
    if (!registration) return res.status(404).json({ error: `Registration not found with id: ${req.params.id}` });

    const email = ((req.body && req.body.userEmail) || '').trim().toLowerCase();
    if (email !== registration.userEmail) {
      return res.status(403).json({ error: 'You can only cancel your own registration' });
    }
    registration.status = 'CANCELLED';
    await registration.save();
    return res.json(registration);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong while cancelling the registration' });
  }
}

module.exports = { register, getByUser, getByEvent, cancelRegistration };
