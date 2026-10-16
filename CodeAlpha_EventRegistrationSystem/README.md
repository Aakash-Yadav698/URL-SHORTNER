# CodeAlpha_EventRegistrationSystem

Full-stack Event Registration System — CodeAlpha Backend Development Internship, **Task 2**.
Express.js + Sequelize backend with a built-in frontend (served from `/public`).

## Run it (3 steps)
```
npm install
npm start
```
Open **http://localhost:8081** — that's it. The default database is SQLite (no install, no config).
Organizer password: `admin123` (change in `.env`).

To use MySQL instead, set `DB_DIALECT=mysql` and the `DB_*` values in `.env`.

## Features (mapped to the task PDF)
| Requirement | Implementation |
|---|---|
| Express backend | `server.js`, routes + controllers |
| Models for events & registrations | `models/Event.js`, `models/Registration.js` (`Event.hasMany(Registration)`) |
| View event list / details / submit registration | `GET /api/events`, `GET /api/events/:id`, `POST /api/registrations` |
| Link registrations to users & events | `EventId` + user name/email on each registration |
| Users view / cancel registrations | "My Registrations" tab (by email) → `PUT /api/registrations/:id/cancel` |
| Optional: auth for organizers / admin panel | Organizer login + panel (create/delete events, view attendees) |

## API
| Method | Path | Access |
|---|---|---|
| POST | `/api/auth/login` | `{password}` → `{token}` |
| GET | `/api/events` | public (includes `confirmedCount`, `seatsLeft`) |
| GET | `/api/events/:id` | public |
| POST | `/api/events` | organizer (Bearer token) |
| DELETE | `/api/events/:id` | organizer |
| POST | `/api/registrations` | public — `{eventId, userName, userEmail}` |
| GET | `/api/registrations/user/:email` | public |
| GET | `/api/registrations/event/:eventId` | organizer |
| PUT | `/api/registrations/:id/cancel` | owner — body `{userEmail}` must match |

## Business rules
- Duplicate confirmed registration (same email + event) → `409`
- Event at capacity → `409`; cancelling frees a seat
- Re-registering after cancelling re-activates the old registration
- Cancelling requires the registrant's own email

## Structure
```
server.js  config/db.js  middleware/auth.js
models/  controllers/  routes/
public/   (index.html, style.css, app.js)
```
