const Event = require('../models/Event');
const Registration = require('../models/Registration');

// Attach live seat counts to an event
async function withCounts(event) {
  const confirmed = await Registration.count({ where: { EventId: event.id, status: 'CONFIRMED' } });
  const json = event.toJSON();
  json.confirmedCount = confirmed;
  json.seatsLeft = Math.max(event.capacity - confirmed, 0);
  return json;
}

// POST /api/events (organizer)
async function createEvent(req, res) {
  try {
    const { title, description, location, eventDateTime, capacity } = req.body;
    if (!title || !location || !eventDateTime || !capacity) {
      return res.status(400).json({ error: 'title, location, eventDateTime and capacity are required' });
    }
    if (Number(capacity) < 1) {
      return res.status(400).json({ error: 'capacity must be a positive number' });
    }
    if (isNaN(new Date(eventDateTime).getTime())) {
      return res.status(400).json({ error: 'eventDateTime is not a valid date' });
    }
    const event = await Event.create({ title, description, location, eventDateTime, capacity: Number(capacity) });
    return res.status(201).json(await withCounts(event));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong while creating the event' });
  }
}

// GET /api/events
async function getAllEvents(req, res) {
  try {
    const events = await Event.findAll({ order: [['eventDateTime', 'ASC']] });
    return res.json(await Promise.all(events.map(withCounts)));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong while fetching events' });
  }
}

// GET /api/events/:id
async function getEventById(req, res) {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: `Event not found with id: ${req.params.id}` });
    return res.json(await withCounts(event));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong while fetching the event' });
  }
}

// DELETE /api/events/:id (organizer)
async function deleteEvent(req, res) {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: `Event not found with id: ${req.params.id}` });
    await Registration.destroy({ where: { EventId: event.id } });
    await event.destroy();
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong while deleting the event' });
  }
}

module.exports = { createEvent, getAllEvents, getEventById, deleteEvent };
